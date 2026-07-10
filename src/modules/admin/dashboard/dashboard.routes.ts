import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);
router.get('/', dashboardController.getStats);
export const dashboardRouter = router;
