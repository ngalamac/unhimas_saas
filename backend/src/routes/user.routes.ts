import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// Apply authentication to all routes
router.use(authenticate);

// User management routes (Super Admin only)
router.get('/', authorize(['all']), userController.getAllUsers);
router.get('/:id', authorize(['all']), userController.getUserById);
router.put('/:id', authorize(['all']), userController.updateUser);
router.delete('/:id', authorize(['all']), userController.deleteUser);
router.put('/:id/activate', authorize(['all']), userController.activateUser);
router.put('/:id/deactivate', authorize(['all']), userController.deactivateUser);

export default router;