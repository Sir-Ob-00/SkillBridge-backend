import { Router } from 'express';
import { verificationController } from './verification.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);
router.get('/', verificationController.getStats);

export const verificationRouter = router;
