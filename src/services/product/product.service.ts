import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/AppError';

export const productSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  stock: true,
  imageUrl: true,
  categoryId: true,
  category: {
    select: { id: true, name: true, slug: true },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

const buildWhere = ({
  categoryId,
  search,
  minPrice,
  maxPrice,
}: {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}): Prisma.ProductWhereInput => {
  const where: Prisma.ProductWhereInput = { isDeleted: false };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  return where;
};

const buildOrderBy = (
  sort: ProductFilters['sort'],
): Prisma.ProductOrderByWithRelationInput => {
  if (sort === 'price_asc') return { price: 'asc' };
  if (sort === 'price_desc') return { price: 'desc' };
  return { createdAt: 'desc' };
};

export const getAllProducts = async ({
  categoryId,
  search,
  minPrice,
  maxPrice,
  sort = 'newest',
  page = 1,
  limit = 12,
}: ProductFilters = {}) => {
  const where = buildWhere({ categoryId, search, minPrice, maxPrice });
  const orderBy = buildOrderBy(sort);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productSelect,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProductById = (id: string) =>
  prisma.product.findFirst({
    where: { id, isDeleted: false },
    select: productSelect,
  });

const ensureCategoryExists = async (categoryId: string): Promise<void> => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, isDeleted: false },
    select: { id: true },
  });

  if (!category) {
    throw new AppError('Category not found', 400);
  }
};

export const createProduct = async (data: {
  name: string;
  description: string;
  price: number;
  stock?: number;
  imageUrl?: string | null;
  categoryId: string;
}) => {
  await ensureCategoryExists(data.categoryId);

  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: Number(data.price.toFixed(2)),
      stock: data.stock ?? 0,
      imageUrl: data.imageUrl ?? null,
      categoryId: data.categoryId,
    },
    select: productSelect,
  });
};

export const updateProduct = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    imageUrl?: string | null;
    categoryId?: string;
  },
) => {
  const existing = await getProductById(id);
  if (!existing) return null;

  if (data.categoryId !== undefined && data.categoryId !== existing.categoryId) {
    await ensureCategoryExists(data.categoryId);
  }

  return prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.price !== undefined ? { price: Number(data.price.toFixed(2)) } : {}),
      ...(data.stock !== undefined ? { stock: data.stock } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
    },
    select: productSelect,
  });
};

export const deleteProduct = async (id: string) => {
  const existing = await getProductById(id);
  if (!existing) return null;

  return prisma.product.update({
    where: { id },
    data: { isDeleted: true },
    select: productSelect,
  });
};
