import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from '../middlewares/auth';
import { authorizeAdmin } from '../middlewares/admin';

const router: Router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'TechGear API is running', data: null });
});

router.get('/example', verifyToken, (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, message: 'Protected route accessed', data: { user: req.auth } });
});

router.get('/example/admin', verifyToken, authorizeAdmin, (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Admin-only route accessed', data: null });
});

export default router;
