import { Response } from 'express';

export const sendResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data: unknown = null,
): Response => {
  return res.status(statusCode).json({ success, message, data });
};
