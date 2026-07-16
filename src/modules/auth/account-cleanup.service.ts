import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

interface CleanupResult {
  deleted: number;
  cutoff: Date;
}

/**
 * Removes abandoned accounts: users created longer ago than the configured
 * retention window that never completed onboarding (no artisan/student
 * profile was created). Accounts that have started onboarding are kept.
 *
 * Related records (refresh tokens, password-reset tokens, profiles, etc.)
 * are removed via Prisma cascade rules.
 */
export const cleanupAbandonedAccounts = async (): Promise<CleanupResult> => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - env.UNVERIFIED_ACCOUNT_TTL_HOURS * 60 * 60 * 1000);

  try {
    const stale = await prisma.user.findMany({
      where: {
        createdAt: { lt: cutoff },
        artisanProfile: null,
        studentProfile: null,
      },
      select: { id: true },
    });

    if (stale.length === 0) {
      logger.info('[cleanup] No abandoned accounts older than', cutoff.toISOString());
      return { deleted: 0, cutoff };
    }

    const ids = stale.map((u) => u.id);

    await prisma.user.deleteMany({ where: { id: { in: ids } } });

    logger.info(`[cleanup] Deleted ${ids.length} abandoned account(s) older than`, cutoff.toISOString());
    return { deleted: ids.length, cutoff };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    logger.error('[cleanup] Failed to remove abandoned accounts:', message);
    throw error;
  }
};

export const accountCleanupService = {
  cleanupAbandonedAccounts,
};
