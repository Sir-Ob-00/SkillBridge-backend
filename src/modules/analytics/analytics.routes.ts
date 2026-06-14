import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireAdmin } from '../../middlewares/requireRole';
import { validate } from '../../middlewares/validate';
import { bookingTrendsQuerySchema } from './analytics.validators';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/overview', analyticsController.overview);
router.get(
  '/booking-trends',
  validate(bookingTrendsQuerySchema, 'query'),
  analyticsController.bookingTrends
);
router.get('/top-categories', analyticsController.topCategories);
router.get('/ratings', analyticsController.averageRatings);

export const analyticsRouter = router;
