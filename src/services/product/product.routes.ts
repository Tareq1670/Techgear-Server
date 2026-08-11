import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth';
import { authorizeAdmin } from '../../middlewares/admin';
import { validate } from '../../middlewares/validate';
import { createProductSchema, updateProductSchema } from './product.schema';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from './product.controller';

const router: Router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', verifyToken, authorizeAdmin, validate(createProductSchema), createProduct);
router.patch(
  '/:id',
  verifyToken,
  authorizeAdmin,
  validate(updateProductSchema),
  updateProduct,
);
router.delete('/:id', verifyToken, authorizeAdmin, deleteProduct);

export default router;
