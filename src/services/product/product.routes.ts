import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createProductSchema, updateProductSchema } from './product.schema';
import {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './product.controller';

const router: Router = Router();

router.get('/', getProducts);
router.get('/my-products', verifyToken, getMyProducts);
router.get('/:id', getProductById);
router.post('/', verifyToken, validate(createProductSchema), createProduct);
router.patch('/:id', verifyToken, validate(updateProductSchema), updateProduct);
router.delete('/:id', verifyToken, deleteProduct);

export default router;
