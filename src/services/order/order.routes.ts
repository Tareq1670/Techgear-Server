import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth';
import { authorizeAdmin } from '../../middlewares/admin';
import { validate } from '../../middlewares/validate';
import { createOrderSchema, updateOrderStatusSchema } from './order.schema';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} from './order.controller';

const router: Router = Router();

router.post('/', verifyToken, validate(createOrderSchema), createOrder);
router.get('/my-orders', verifyToken, getMyOrders);
router.get('/', verifyToken, authorizeAdmin, getAllOrders);
router.patch(
  '/:id/status',
  verifyToken,
  authorizeAdmin,
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);
router.delete('/:id', verifyToken, authorizeAdmin, deleteOrder);

export default router;
