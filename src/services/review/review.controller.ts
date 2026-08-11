import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { AppError } from '../../lib/AppError';
import { sendResponse } from '../../lib/response';
import * as reviewService from './review.service';

const ensureOwnership = (
  reviewUserId: string,
  auth: AuthRequest['auth'],
  action: 'update' | 'delete',
): void => {
  const isAdmin = auth?.role === 'ADMIN';
  const isOwner = auth?.sub === reviewUserId;

  if (!isAdmin && !isOwner) {
    throw new AppError(`Forbidden: You can only ${action} your own review`, 403);
  }
};

export const getReviewsByProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const productId = String(req.params.productId);
  const reviews = await reviewService.getReviewsByProduct(productId);
  sendResponse(res, 200, true, 'Reviews fetched successfully', { reviews });
};

export const createReview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.auth?.sub;
  if (!userId) {
    throw new AppError('Unauthorized access', 401);
  }

  const review = await reviewService.createReview({ ...req.body, userId });
  sendResponse(res, 201, true, 'Review created successfully', { review });
};

export const updateReview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const id = String(req.params.id);
  const review = await reviewService.getReviewById(id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  ensureOwnership(review.userId, req.auth, 'update');

  const updated = await reviewService.updateReview(id, req.body);
  sendResponse(res, 200, true, 'Review updated successfully', { review: updated });
};

export const deleteReview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const id = String(req.params.id);
  const review = await reviewService.getReviewById(id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  ensureOwnership(review.userId, req.auth, 'delete');

  await reviewService.deleteReview(id);
  sendResponse(res, 200, true, 'Review deleted successfully');
};
