import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { AppError } from '../../lib/AppError';
import { sendResponse } from '../../lib/response';
import * as userService from './user.service';

export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  const users = await userService.getAllUsers();
  sendResponse(res, 200, true, 'Users fetched successfully', { users });
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const isAdmin = req.auth?.role === 'ADMIN';
  const isSelf = req.auth?.sub === id;

  if (!isAdmin && !isSelf) {
    throw new AppError('Forbidden: You can only view your own profile', 403);
  }

  const user = await userService.getUserById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  sendResponse(res, 200, true, 'User fetched successfully', { user });
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);

  if (req.auth?.sub !== id) {
    throw new AppError('Forbidden: You can only update your own profile', 403);
  }

  const user = await userService.updateUser(id, req.body);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  sendResponse(res, 200, true, 'User updated successfully', { user });
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const isAdmin = req.auth?.role === 'ADMIN';
  const isSelf = req.auth?.sub === id;

  if (!isAdmin && !isSelf) {
    throw new AppError('Forbidden: You can only delete your own account', 403);
  }

  const user = await userService.deleteUser(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  sendResponse(res, 200, true, 'User deleted successfully');
};
