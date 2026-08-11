import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError';
import { sendResponse } from '../lib/response';

export const notFound = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError('Route not found', 404));
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    sendResponse(res, err.statusCode, false, err.message);
    return;
  }

  console.error('[error]', err);
  sendResponse(res, 500, false, 'Internal server error');
};
