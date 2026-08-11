import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../middlewares/auth';
import { sendResponse } from '../lib/response';
import prisma from '../lib/prisma';

const router: Router = Router();

router.get('/me', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const payload = req.auth;

  if (!payload?.sub) {
    sendResponse(res, 401, false, 'Unauthorized access');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.sub, isDeleted: false },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

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
});

export default router;
