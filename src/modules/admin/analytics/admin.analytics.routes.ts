import { Router } from 'express';
import { adminAnalyticsController } from './admin.analytics.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { adminOnly } from '../../../middlewares/adminOnly';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/', adminAnalyticsController.getAnalytics);

export const adminAnalyticsRouter = router;
