import { Router } from 'express';
import { adminAnalyticsController, analyticsQuerySchema } from './admin.analytics.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', validate(analyticsQuerySchema, 'query'), adminAnalyticsController.getAnalytics as any);
router.get('/overview', validate(analyticsQuerySchema, 'query'), adminAnalyticsController.overview as any);
router.get('/users', validate(analyticsQuerySchema, 'query'), adminAnalyticsController.users as any);
router.get('/bookings', validate(analyticsQuerySchema, 'query'), adminAnalyticsController.bookings as any);
router.get('/reviews', validate(analyticsQuerySchema, 'query'), adminAnalyticsController.reviews as any);
router.get('/reports', validate(analyticsQuerySchema, 'query'), adminAnalyticsController.reports as any);
router.get('/categories', validate(analyticsQuerySchema, 'query'), adminAnalyticsController.categories as any);
router.get('/revenue', validate(analyticsQuerySchema, 'query'), adminAnalyticsController.revenue as any);

export const adminAnalyticsRouter = router;
