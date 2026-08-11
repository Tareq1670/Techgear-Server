import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { AppError } from '../../lib/AppError';
import { sendResponse } from '../../lib/response';
import * as orderService from './order.service';

export const createOrder = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.auth?.sub;
  if (!userId) {
    throw new AppError('Unauthorized access', 401);
  }

  const order = await orderService.createOrder({ ...req.body, userId });
  sendResponse(res, 201, true, 'Order created successfully', { order });
};

export const getMyOrders = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.auth?.sub;
  if (!userId) {
    throw new AppError('Unauthorized access', 401);
  }

  const orders = await orderService.getOrdersByUser(userId);
  sendResponse(res, 200, true, 'Orders fetched successfully', { orders });
};

export const getAllOrders = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const orders = await orderService.getAllOrders();
  sendResponse(res, 200, true, 'Orders fetched successfully', { orders });
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = String(req.params.id);
  const order = await orderService.updateOrderStatus(id, req.body.status);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  sendResponse(res, 200, true, 'Order status updated successfully', { order });
};

export const deleteOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = String(req.params.id);
  const order = await orderService.deleteOrder(id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  sendResponse(res, 200, true, 'Order deleted successfully');
};
