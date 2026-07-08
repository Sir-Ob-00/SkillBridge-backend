import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { adminOnly } from '../../middlewares/adminOnly';

import { adminAuthRouter } from './auth/admin.auth.routes';
import { adminProfileRouter } from './profile/admin.profile.routes';
import { dashboardRouter } from './dashboard/dashboard.routes';
import { adminUsersRouter } from './users/admin.users.routes';
import { adminCategoriesRouter } from './categories/admin.categories.routes';
import { adminVerificationsRouter } from './verification/admin.verification.routes';
import { adminPortfoliosRouter } from './portfolio/admin.portfolio.routes';
import { adminBookingsRouter } from './bookings/admin.bookings.routes';
import { adminPaymentsRouter } from './payments/admin.payments.routes';
import { adminReviewsRouter } from './reviews/admin.reviews.routes';
import { adminReportsRouter } from './reports/admin.reports.routes';
import { adminNotificationsRouter } from './notifications/admin.notifications.routes';
import { adminCmsRouter } from './cms/admin.cms.routes';
import { adminAnalyticsRouter } from './analytics/admin.analytics.routes';
import { adminSettingsRouter } from './settings/admin.settings.routes';
import { adminAuditLogsRouter } from './auditLogs/admin.auditLogs.routes';

const router = Router();

// Public admin route (no auth required).
router.use('/login', adminAuthRouter);

// Every other admin route requires a valid admin/super_admin session.
router.use(authenticate, adminOnly);

router.use('/profile', adminProfileRouter);
router.use('/dashboard', dashboardRouter);
router.use('/users', adminUsersRouter);
router.use('/categories', adminCategoriesRouter);
router.use('/verifications', adminVerificationsRouter);
router.use('/portfolios', adminPortfoliosRouter);
router.use('/bookings', adminBookingsRouter);
router.use('/payments', adminPaymentsRouter);
router.use('/reviews', adminReviewsRouter);
router.use('/reports', adminReportsRouter);
router.use('/notifications', adminNotificationsRouter);
router.use('/content', adminCmsRouter);
router.use('/analytics', adminAnalyticsRouter);
router.use('/settings', adminSettingsRouter);
router.use('/audit-logs', adminAuditLogsRouter);

export const adminRouter = router;
