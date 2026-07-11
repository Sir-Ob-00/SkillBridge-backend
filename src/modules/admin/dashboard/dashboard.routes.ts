import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', dashboardController.getStats);
router.get('/overview', dashboardController.overview);
router.get('/statistics', dashboardController.statistics);
router.get('/recent-activities', dashboardController.recentActivities);
router.get('/recent-bookings', dashboardController.recentBookings);
router.get('/recent-reviews', dashboardController.recentReviews);
router.get('/recent-reports', dashboardController.recentReports);

export const dashboardRouter = router;
