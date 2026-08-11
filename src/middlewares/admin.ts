import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { sendResponse } from '../lib/response';

export const authorizeAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.auth?.role !== 'ADMIN') {
    sendResponse(res, 403, false, 'Forbidden: Admin access required');
    return;
  }
  next();
};
