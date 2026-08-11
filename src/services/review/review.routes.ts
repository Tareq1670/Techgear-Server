import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createReviewSchema, updateReviewSchema } from './review.schema';
import {
  getReviewsByProduct,
  createReview,
  updateReview,
  deleteReview,
} from './review.controller';

const router: Router = Router();

router.get('/product/:productId', getReviewsByProduct);
router.post('/', verifyToken, validate(createReviewSchema), createReview);
router.patch('/:id', verifyToken, validate(updateReviewSchema), updateReview);
router.delete('/:id', verifyToken, deleteReview);

export default router;
