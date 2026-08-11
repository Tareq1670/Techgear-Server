import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose-cjs';
import { config } from '../config';

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
    res.status(401).json({ success: false, message: 'Unauthorized access', data: null });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized access', data: null });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.auth = payload as AuthPayload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Unauthorized access', data: null });
  }
};
