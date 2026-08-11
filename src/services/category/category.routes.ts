import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth';
import { authorizeAdmin } from '../../middlewares/admin';
import { validate } from '../../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from './category.schema';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './category.controller';

const router: Router = Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', verifyToken, authorizeAdmin, validate(createCategorySchema), createCategory);
router.patch(
  '/:id',
  verifyToken,
  authorizeAdmin,
  validate(updateCategorySchema),
  updateCategory,
);
router.delete('/:id', verifyToken, authorizeAdmin, deleteCategory);

export default router;
