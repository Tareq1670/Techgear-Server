import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose-cjs';
import { config } from '../config';
import { sendResponse } from '../lib/response';

const JWKS = createRemoteJWKSet(new URL(`${config.clientUrl}/api/auth/jwks`));

export interface AuthPayload {
  sub?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthRequest extends Request {
  auth?: AuthPayload;
}

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    sendResponse(res, 401, false, 'Unauthorized access');
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    sendResponse(res, 401, false, 'Unauthorized access');
    return;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.auth = payload as AuthPayload;
    next();
  } catch (err) {
    console.error('[auth] verify failed:', err);
    sendResponse(res, 401, false, 'Unauthorized access');
  }
};
