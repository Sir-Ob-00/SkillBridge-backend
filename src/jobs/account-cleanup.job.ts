import cron, { ScheduledTask } from 'node-cron';
import { cleanupAbandonedAccounts } from '../modules/auth/account-cleanup.service';
import { logger } from '../utils/logger';

let task: ScheduledTask | null = null;

/**
 * Runs the unverified-account cleanup once per day at midnight (server time).
 * Throws are swallowed so a single failed run never crashes the schedule.
 */
const runCleanup = async (): Promise<void> => {
  try {
    const result = await cleanupAbandonedAccounts();
    logger.info(`[cleanup] Scheduled run complete (${result.deleted} removed).`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    logger.error('[cleanup] Scheduled run failed:', message);
  }
};

/** Starts the daily cleanup cron job. Safe to call once at server boot. */
export const startAccountCleanupJob = (): ScheduledTask => {
  if (task) {
    return task;
  }

  // "0 0 * * *" -> At 00:00 every day.
  task = cron.schedule('0 0 * * *', runCleanup, {
    scheduled: true,
    timezone: 'UTC',
  });

  logger.info('[cleanup] Daily unverified-account cleanup scheduled (00:00 UTC).');
  return task;
};

/** Stops the cleanup cron job (used in tests / graceful shutdown). */
export const stopAccountCleanupJob = (): void => {
  if (task) {
    task.stop();
    task = null;
    logger.info('[cleanup] Cleanup job stopped.');
  }
};

export const accountCleanupScheduler = {
  start: startAccountCleanupJob,
  stop: stopAccountCleanupJob,
};
