import { Router } from 'express';
import { adminAuthController } from './admin.auth.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';

const router = Router();

// Public admin auth endpoints (no session required).
router.post('/login', adminAuthController.login as any);
router.post('/refresh-token', adminAuthController.refresh as any);
router.post('/logout', adminAuthController.logout as any);
router.post('/forgot-password', adminAuthController.forgotPassword as any);
router.post('/reset-password', adminAuthController.resetPassword as any);

// Authenticated admin-only endpoints.
router.use(requireAuth, adminOnly);
router.get('/me', adminAuthController.me);

export const adminAuthRouter = router;
