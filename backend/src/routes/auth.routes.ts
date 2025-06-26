import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation';
import { userLoginSchema, userRegistrationSchema } from '../utils/validation';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validate(userLoginSchema), authController.login);
router.post('/register', validate(userRegistrationSchema), authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);

// Protected routes
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authController.getProfile);
router.put('/change-password', authController.changePassword);

export default router;