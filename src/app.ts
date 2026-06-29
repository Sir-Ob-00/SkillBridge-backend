import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { apiLimiter } from './middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { artisansRouter } from './modules/artisans/artisans.routes';
import { studentsRouter } from './modules/students/students.routes';
import { bookingsRouter } from './modules/bookings/bookings.routes';
import { reviewsRouter } from './modules/reviews/reviews.routes';
import { categoriesRouter } from './modules/categories/categories.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { chatRouter } from './modules/messages/messages.routes';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  app.use(apiLimiter);
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

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

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
