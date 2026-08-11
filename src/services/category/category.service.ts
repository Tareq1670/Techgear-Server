import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/AppError';

export const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

export const generateSlug = (name: string): string => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `category-${Date.now().toString(36)}`;
};

const handleUniqueError = (err: unknown): AppError => {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return new AppError('Category name or slug already exists', 409);
  }
  throw err;
};

export const getAllCategories = () =>
  prisma.category.findMany({
    where: { isDeleted: false },
    select: categorySelect,
    orderBy: { createdAt: 'desc' },
  });

export const getCategoryById = (id: string) =>
  prisma.category.findFirst({
    where: { id, isDeleted: false },
    select: categorySelect,
  });

export const createCategory = async (data: {
  name: string;
  description?: string | null;
}) => {
  try {
    return await prisma.category.create({
      data: {
        name: data.name,
        slug: generateSlug(data.name),
        description: data.description ?? null,
      },
      select: categorySelect,
    });
  } catch (err) {
    throw handleUniqueError(err);
  }
};

export const updateCategory = async (
  id: string,
  data: { name?: string; description?: string | null },
) => {
  const existing = await getCategoryById(id);
  if (!existing) return null;

  try {
    return await prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined
          ? { name: data.name, slug: generateSlug(data.name) }
          : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
      select: categorySelect,
    });
  } catch (err) {
    throw handleUniqueError(err);
  }
};

export const deleteCategory = async (id: string) => {
  const existing = await getCategoryById(id);
  if (!existing) return null;

  return prisma.category.update({
    where: { id },
    data: { isDeleted: true },
    select: categorySelect,
  });
};
