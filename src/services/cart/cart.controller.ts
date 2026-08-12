import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { AppError } from '../../lib/AppError';
import { sendResponse } from '../../lib/response';
import * as cartService from './cart.service';

const getUserId = (req: AuthRequest): string => {
  const userId = req.auth?.sub;
  if (!userId) {
    throw new AppError('Unauthorized access', 401);
  }
  return userId;
};

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  const cart = await cartService.getCart(getUserId(req));
  sendResponse(res, 200, true, 'Cart fetched successfully', { cart });
};

export const addCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const cart = await cartService.addCartItem(
    getUserId(req),
    req.body.productId,
    req.body.quantity,
  );
  sendResponse(res, 200, true, 'Item added to cart', { cart });
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const cart = await cartService.updateCartItem(
    getUserId(req),
    String(req.params.productId),
    req.body.quantity,
  );
  sendResponse(res, 200, true, 'Cart updated', { cart });
};

export const removeCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const cart = await cartService.removeCartItem(
    getUserId(req),
    String(req.params.productId),
  );
  sendResponse(res, 200, true, 'Item removed from cart', { cart });
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  const cart = await cartService.clearCart(getUserId(req));
  sendResponse(res, 200, true, 'Cart cleared', { cart });
};
