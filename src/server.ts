import http from 'http';
import { createApp } from './app';
import { initSockets } from './sockets';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './utils/logger';
import { categoriesService } from './modules/categories/categories.service';

const bootstrap = async (): Promise<void> => {
  const app = createApp();
  const httpServer = http.createServer(app);

  initSockets(httpServer);

  // Seed default categories on first run.
  await categoriesService.ensureDefaults();

  httpServer.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`SkillBridge API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    httpServer.close(() => logger.info('HTTP server closed.'));
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
