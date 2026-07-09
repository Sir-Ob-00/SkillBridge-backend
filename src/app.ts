import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { apiLimiter } from './middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { artisansRouter } from './modules/mobile/artisans/artisans.routes';
import { studentsRouter } from './modules/mobile/students/students.routes';
import { bookingsRouter } from './modules/bookings/bookings.routes';
import { reviewsRouter } from './modules/reviews/reviews.routes';
import { categoriesRouter } from './modules/categories/categories.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { chatRouter } from './modules/messages/messages.routes';
import { adminRouter } from './modules/admin/admin.routes';

// Admin sub-routers
import { dashboardRouter } from './modules/admin/dashboard/dashboard.routes';
import { adminUsersRouter } from './modules/admin/users/users.routes';
import { adminCategoriesRouter } from './modules/admin/categories/categories.routes';
import { adminReviewsRouter } from './modules/admin/reviews/reviews.routes';
import { adminReportsRouter } from './modules/admin/reports/reports.routes';
import { adminSettingsRouter } from './modules/admin/settings/settings.routes';
import { auditLogsRouter } from './modules/admin/auditLogs/auditLogs.routes';
import { adminProfileRouter } from './modules/admin/profile/profile.routes';
import { notificationsRouter } from './modules/admin/notifications/notifications.routes';
import { adminBookingsRouter } from './modules/admin/bookings/bookings.routes';
import { adminPaymentsRouter } from './modules/admin/payments/payments.routes';
import { cmsRouter } from './modules/admin/cms/cms.routes';
import { verificationRouter } from './modules/admin/verification/verification.routes';
import { portfolioRouter } from './modules/admin/portfolio/portfolio.routes';
import { uploadsRouter } from './modules/admin/uploads/uploads.routes';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  app.use(apiLimiter);

  app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'SkillBridge API is running.', timestamp: new Date().toISOString() });
  });

  const apiRouter = express.Router();
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

  // Admin namespace: register specific sub-routers BEFORE the catch-all admin router
  apiRouter.use('/admin/dashboard', dashboardRouter);
  apiRouter.use('/admin/users', adminUsersRouter);
  apiRouter.use('/admin/categories', adminCategoriesRouter);
  apiRouter.use('/admin/reviews', adminReviewsRouter);
  apiRouter.use('/admin/reports', adminReportsRouter);
  apiRouter.use('/admin/settings', adminSettingsRouter);
  apiRouter.use('/admin/audit-logs', auditLogsRouter);
  apiRouter.use('/admin/profile', adminProfileRouter);
  apiRouter.use('/admin/notifications', notificationsRouter);
  apiRouter.use('/admin/bookings', adminBookingsRouter);
  apiRouter.use('/admin/payments', adminPaymentsRouter);
  apiRouter.use('/admin/content', cmsRouter);
  apiRouter.use('/admin/verifications', verificationRouter);
  apiRouter.use('/admin/portfolios', portfolioRouter);
  apiRouter.use('/admin/uploads', uploadsRouter);
  // Shared analytics is also available under /api/v1/admin/analytics
  apiRouter.use('/admin/analytics', analyticsRouter);
  // Legacy admin endpoints (approve/reject/pending) remain available under /api/v1/admin
  apiRouter.use('/admin', adminRouter);

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
