import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/AppError';

export const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  productId: true,
  userId: true,
  user: {
    select: { id: true, name: true },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReviewSelect;

const ensureProductExists = async (productId: string): Promise<void> => {
  const product = await prisma.product.findFirst({
    where: { id: productId, isDeleted: false },
    select: { id: true },
  });

  if (!product) {
    throw new AppError('Product not found', 400);
  }
};

export const getReviewById = (id: string) =>
  prisma.review.findFirst({
    where: { id, isDeleted: false },
    select: reviewSelect,
  });

export const getReviewsByProduct = (productId: string) =>
  prisma.review.findMany({
    where: {
      productId,
      isDeleted: false,
      product: { isDeleted: false },
      user: { isDeleted: false },
    },
    select: reviewSelect,
    orderBy: { createdAt: 'desc' },
  });

export const createReview = async (data: {
  rating: number;
  comment: string;
  productId: string;
  userId: string;
}) => {
  await ensureProductExists(data.productId);

  return prisma.review.create({
    data: {
      rating: data.rating,
      comment: data.comment,
      productId: data.productId,
      userId: data.userId,
    },
    select: reviewSelect,
  });
};

export const updateReview = async (
  id: string,
  data: { rating?: number; comment?: string },
) => {
  const existing = await getReviewById(id);
  if (!existing) return null;

  return prisma.review.update({
    where: { id },
    data: {
      ...(data.rating !== undefined ? { rating: data.rating } : {}),
      ...(data.comment !== undefined ? { comment: data.comment } : {}),
    },
    select: reviewSelect,
  });
};

export const deleteReview = async (id: string) => {
  const existing = await getReviewById(id);
  if (!existing) return null;

  return prisma.review.update({
    where: { id },
    data: { isDeleted: true },
    select: reviewSelect,
  });
};
