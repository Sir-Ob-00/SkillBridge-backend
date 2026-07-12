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
import { logger } from '../utils/logger';
import { getIO } from '../sockets/io';

const rawOrigins = env.CORS_ORIGIN
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://localhost:5175',
  ...rawOrigins,
]);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has('*')) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    logger.warn('[CORS] Blocked origin', {
      origin,
    });

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export const createApp = (): Express => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction
    ): void => {
      logger.info('[CORS DEBUG] incoming request', {
        method: req.method,
        url: req.originalUrl,
        origin: req.headers.origin || 'no-origin',
      });
      next();
    }
  );

  app.use(helmet());
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  app.use(apiLimiter);
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'SkillBridge API is running.', timestamp: new Date().toISOString() });
  });

  app.get('/socket-health', (_req, res) => {
    const io = getIO();
    res.json({
      ok: true,
      socketMounted: !!io,
      clients: io?.engine?.clientsCount ?? 0,
    });
  });

  app.get('/socket-test', (_req, res) => {
    res.json({
      ok: true,
      message: 'Express receives normal requests',
    });
  });

  app.get('/socket-test/*', (req, res) => {
    res.json({
      ok: true,
      path: req.originalUrl,
    });
  });

  app.use('/api/v1', createApiRouter());

  setupSwagger(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
