import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

interface CleanupResult {
  deleted: number;
  cutoff: Date;
}

/**
 * Removes abandoned, unverified accounts: users with `emailVerified = false`
 * whose `createdAt` is older than the configured retention window.
 *
 * Verified users are never touched, and deletion is based solely on the
 * account age + verification status (never on OTP expiry). Related records
 * (OTP, refresh tokens, password-reset tokens, profiles, etc.) are removed
 * via Prisma cascade rules, with an explicit OTP delete as a safety net.
 */
export const cleanupUnverifiedAccounts = async (): Promise<CleanupResult> => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - env.UNVERIFIED_ACCOUNT_TTL_HOURS * 60 * 60 * 1000);

  try {
    // Safety net: explicitly clear OTP rows for the targets before deleting
    // the users. The FK cascade would handle this too, but doing it manually
    // guarantees no orphaned OTP rows regardless of cascade configuration.
    const stale = await prisma.user.findMany({
      where: {
        emailVerified: false,
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    });

    if (stale.length === 0) {
      logger.info('[cleanup] No unverified accounts older than', cutoff.toISOString());
      return { deleted: 0, cutoff };
    }

    const ids = stale.map((u) => u.id);

    // Remove dependent OTP rows first, then the users. The OTP delete is a
    // safety net in addition to the FK cascade on the user delete.
    await prisma.emailVerificationOTP.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });

    logger.info(`[cleanup] Deleted ${ids.length} unverified account(s) older than`, cutoff.toISOString());
    return { deleted: ids.length, cutoff };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    logger.error('[cleanup] Failed to remove unverified accounts:', message);
    throw error;
  }
};

export const accountCleanupService = {
  cleanupUnverifiedAccounts,
};
