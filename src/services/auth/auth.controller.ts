import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { AppError } from '../../lib/AppError';
import { sendResponse } from '../../lib/response';
import { getUserBySub } from './auth.service';

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const payload = req.auth;

  if (!payload?.sub) {
    throw new AppError('Unauthorized access', 401);
  }

  const user = await getUserBySub(payload.sub);

  if (user) {
    sendResponse(res, 200, true, 'User fetched successfully', { user });
    return;
  }

  sendResponse(res, 200, true, 'User fetched from token', {
    user: {
      id: payload.sub,
      email: payload.email ?? null,
      name: null,
      role: payload.role ?? 'USER',
    },
  });
};
