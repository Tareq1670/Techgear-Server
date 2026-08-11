import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth';
import { getMe } from './auth.controller';

const router: Router = Router();

router.get('/me', verifyToken, getMe);

export default router;
