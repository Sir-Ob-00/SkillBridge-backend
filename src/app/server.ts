import http from 'http';
import { createApp } from './app';
import { initSockets } from '../sockets';
import { getIO } from '../sockets/io';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { categoriesService } from '../modules/categories/categories.service';
import { skillsService } from '../modules/skills/skills.service';
import { startAccountCleanupJob } from '../jobs/account-cleanup.job';

const bootstrap = async (): Promise<void> => {
  const app = createApp();
  logger.info('HTTP server created');

  const httpServer = http.createServer(app);
  logger.info('Express mounted on HTTP server');

  initSockets(httpServer);
  const io = getIO();
  logger.info(`Socket.IO mounted: ${io ? 'yes' : 'no'}`);
  logger.info('Socket.IO path: /socket.io/');

  await categoriesService.ensureDefaults();
  await skillsService.ensureDefaults();

  startAccountCleanupJob();

  httpServer.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${env.PORT} is already in use. Stop the existing process or use another port.`);
      process.exit(1);
    }
    throw error;
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
