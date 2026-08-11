import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from '../middlewares/auth';
import { authorizeAdmin } from '../middlewares/admin';
import { sendResponse } from '../lib/response';
import authRoutes from './auth';

const router: Router = Router();

router.use('/auth', authRoutes);

router.get('/', (_req: Request, res: Response) => {
  sendResponse(res, 200, true, 'TechGear API is running');
});

router.get('/example', verifyToken, (req: AuthRequest, res: Response) => {
  sendResponse(res, 200, true, 'Protected route accessed', { user: req.auth });
});

router.get('/example/admin', verifyToken, authorizeAdmin, (_req: Request, res: Response) => {
  sendResponse(res, 200, true, 'Admin-only route accessed');
});

export default router;
