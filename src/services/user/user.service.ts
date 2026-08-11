import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/AppError';

export const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const getAllUsers = () =>
  prisma.user.findMany({
    where: { isDeleted: false },
    select: userSelect,
    orderBy: { createdAt: 'desc' },
  });

export const getUserById = (id: string) =>
  prisma.user.findFirst({
    where: { id, isDeleted: false },
    select: userSelect,
  });

export const updateUser = async (
  id: string,
  data: { name?: string; email?: string },
) => {
  const existing = await getUserById(id);
  if (!existing) return null;

  try {
    return await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError('Email already in use', 409);
    }
    throw err;
  }
};

export const deleteUser = async (id: string) => {
  const existing = await getUserById(id);
  if (!existing) return null;

  return prisma.user.update({
    where: { id },
    data: { isDeleted: true },
    select: userSelect,
  });
};
