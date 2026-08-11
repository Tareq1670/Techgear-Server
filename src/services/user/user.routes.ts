import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth';
import { authorizeAdmin } from '../../middlewares/admin';
import { validate } from '../../middlewares/validate';
import { updateUserSchema } from './user.schema';
import { getUsers, getUserById, updateUser, deleteUser } from './user.controller';

const router: Router = Router();

router.get('/', verifyToken, authorizeAdmin, getUsers);
router.get('/:id', verifyToken, getUserById);
router.patch('/:id', verifyToken, validate(updateUserSchema), updateUser);
router.delete('/:id', verifyToken, deleteUser);

export default router;
