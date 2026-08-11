import { Router, Request, Response } from 'express';
import { verifyToken, AuthRequest } from '../middlewares/auth';
import { authorizeAdmin } from '../middlewares/admin';
import { sendResponse } from '../lib/response';
import authRoutes from '../services/auth/auth.routes';
import userRoutes from '../services/user/user.routes';
import categoryRoutes from '../services/category/category.routes';
import productRoutes from '../services/product/product.routes';
import reviewRoutes from '../services/review/review.routes';
import orderRoutes from '../services/order/order.routes';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/reviews', reviewRoutes);
router.use('/orders', orderRoutes);

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
