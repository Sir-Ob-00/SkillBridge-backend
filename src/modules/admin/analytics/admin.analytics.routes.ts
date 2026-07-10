import { Router } from 'express';
import { adminAnalyticsController } from './admin.analytics.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminAnalyticsController.getAnalytics);

export const adminAnalyticsRouter = router;
