import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.routes';
import { usersRouter } from '../modules/users/users.routes';
import { artisansRouter } from '../modules/mobile/artisans/artisans.routes';
import { studentsRouter } from '../modules/mobile/students/students.routes';
import { bookingsRouter } from '../modules/bookings/bookings.routes';
import { reviewsRouter } from '../modules/reviews/reviews.routes';
import { categoriesRouter } from '../modules/categories/categories.routes';
import { reportsRouter } from '../modules/reports/reports.routes';
import { analyticsRouter } from '../modules/analytics/analytics.routes';
import { chatRouter } from '../modules/messages/messages.routes';
import { skillsRouter } from '../modules/skills/skills.routes';
import { uploadsPublicRouter } from '../modules/uploads/uploads.routes';
import { adminRouter } from '../modules/admin/admin.routes';
import * as adminRouters from '../modules/admin';

/**
 * Builds the `/api/v1` router. Mobile app endpoints stay unchanged under their
 * original paths; the admin dashboard is mounted under `/api/v1/admin`.
 */
export const createApiRouter = (): Router => {
  const apiRouter = Router();

  apiRouter.use('/auth', authRouter);
  apiRouter.use('/users', usersRouter);
  apiRouter.use('/artisans', artisansRouter);
  apiRouter.use('/students', studentsRouter);
  apiRouter.use('/bookings', bookingsRouter);
  apiRouter.use('/reviews', reviewsRouter);
  apiRouter.use('/categories', categoriesRouter);
  apiRouter.use('/reports', reportsRouter);
  apiRouter.use('/analytics', analyticsRouter);
  apiRouter.use('/chats', chatRouter);
  apiRouter.use('/skills', skillsRouter);
  apiRouter.use('/uploads', uploadsPublicRouter);

  apiRouter.use('/admin/auth', adminRouters.adminAuthRouter);
  apiRouter.use('/admin/profile', adminRouters.adminProfileRouter);
  apiRouter.use('/admin/dashboard', adminRouters.dashboardRouter);
  apiRouter.use('/admin/students', adminRouters.adminStudentsRouter);
  apiRouter.use('/admin/artisans', adminRouters.adminArtisansRouter);
  apiRouter.use('/admin/verifications', adminRouters.adminVerificationsRouter);
  apiRouter.use('/admin/categories', adminRouters.adminCategoriesRouter);
  apiRouter.use('/admin/skills', adminRouters.adminSkillsRouter);
  apiRouter.use('/admin/bookings', adminRouters.adminBookingsRouter);
  apiRouter.use('/admin/reviews', adminRouters.adminReviewsRouter);
  apiRouter.use('/admin/reports', adminRouters.adminReportsRouter);
  apiRouter.use('/admin/notifications', adminRouters.adminNotificationsRouter);
  apiRouter.use('/admin/analytics', adminRouters.adminAnalyticsRouter);
  apiRouter.use('/admin/settings', adminRouters.adminSettingsRouter);
  apiRouter.use('/admin/users', adminRouters.adminUsersRouter);
  apiRouter.use('/admin/audit-logs', adminRouters.adminAuditLogsRouter);
  apiRouter.use('/admin/applications', adminRouters.applicationsRouter);
  apiRouter.use('/admin/portfolio', adminRouters.adminPortfoliosRouter);
  apiRouter.use('/admin/cms', adminRouters.adminCmsRouter);
  apiRouter.use('/admin/uploads', adminRouters.uploadsRouter);
  apiRouter.use('/admin/payments', adminRouters.adminPaymentsRouter);
  apiRouter.use('/admin', adminRouter);

  return apiRouter;
};
