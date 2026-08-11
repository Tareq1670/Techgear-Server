import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const authorizeAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.auth?.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Forbidden: Admin access required', data: null });
    return;
  }
  next();
};
