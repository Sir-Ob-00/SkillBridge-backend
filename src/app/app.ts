import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from '../config/env';
import { apiLimiter } from '../middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from '../middlewares/errorHandler';
import { createApiRouter } from '../routes';
import { setupSwagger } from '../docs/swagger';

export const createApp = (): Express => {
  const app = express();

  app.set("trust proxy", 1);

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

  app.use('/api/v1', createApiRouter());

  setupSwagger(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
