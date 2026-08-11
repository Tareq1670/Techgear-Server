import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose-cjs';
import { config } from '../config';
import { sendResponse } from '../lib/response';

const JWKS_TIMEOUT_MS = 5000;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

const getJwks = (): ReturnType<typeof createRemoteJWKSet> => {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${config.clientUrl}/api/auth/jwks`), {
      timeoutDuration: JWKS_TIMEOUT_MS,
    });
  }
  return jwks;
};

export interface AuthPayload {
  sub?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthRequest extends Request {
  auth?: AuthPayload;
}

export const isDevMockEnabled = (): boolean => config.nodeEnv !== 'production';

export const getDevMockPayload = (): AuthPayload => ({
  sub: config.devMock.userId,
  email: config.devMock.email,
  role: config.devMock.role,
});

const parseDevUserHeader = (req: Request): AuthPayload | null => {
  const raw = req.headers['x-dev-user'];
  if (typeof raw !== 'string' || raw.length === 0) return null;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as AuthPayload;
  } catch {
    return null;
  }
};

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (isDevMockEnabled()) {
      const devUser = parseDevUserHeader(req);
      if (devUser) {
        req.auth = devUser;
        next();
        return;
      }
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      sendResponse(res, 401, false, 'Unauthorized access');
      return;
    }

    if (isDevMockEnabled() && token === config.devMock.token) {
      req.auth = getDevMockPayload();
      next();
      return;
    }

    const { payload } = await jwtVerify(token, getJwks());
    req.auth = payload as AuthPayload;
    next();
  } catch (err) {
    console.error('[auth] verify failed:', err);
    sendResponse(res, 401, false, 'Unauthorized access');
  }
};
