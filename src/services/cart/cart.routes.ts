import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { addCartItemSchema, updateCartItemSchema } from './cart.schema';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from './cart.controller';

const router: Router = Router();

router.get('/', verifyToken, getCart);
router.delete('/', verifyToken, clearCart);
router.post('/items', verifyToken, validate(addCartItemSchema), addCartItem);
router.patch('/items/:productId', verifyToken, validate(updateCartItemSchema), updateCartItem);
router.delete('/items/:productId', verifyToken, removeCartItem);

export default router;
