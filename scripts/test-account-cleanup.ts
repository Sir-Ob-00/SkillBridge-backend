/**
 * Manual verification for the unverified-account cleanup.
 *
 * Run with:  npx tsx scripts/test-account-cleanup.ts
 *
 * It creates:
 *  - an unverified user older than the retention window (should be deleted)
 *  - an unverified user created recently (should be kept)
 *  - a verified user older than the window (should be kept)
 * then runs the cleanup and asserts the correct outcome, including that the
 * orphaned OTP row is removed with the stale unverified user.
 */
import { prisma } from '../src/config/prisma';
import { env } from '../src/config/env';
import { cleanupUnverifiedAccounts } from '../src/modules/auth/account-cleanup.service';
import { hashPassword } from '../src/utils/password';

const uid = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
const email = (tag: string) => `cleanup_${tag}_${uid()}@example.com`;

let passed = 0;
let failed = 0;
const ok = (l: string) => {
  passed += 1;
  console.log(`  ✓ ${l}`);
};
const fail = (l: string, d?: unknown) => {
  failed += 1;
  console.error(`  ✗ ${l}`, d ?? '');
};

const main = async () => {
  const staleUnverified = email('stale');
  const freshUnverified = email('fresh');
  const staleVerified = email('verified');
  const passwordHash = await hashPassword('Password123');

  const oldDate = new Date(Date.now() - (env.UNVERIFIED_ACCOUNT_TTL_HOURS + 1) * 60 * 60 * 1000);
  const recentDate = new Date();

  // Stale, unverified -> should be deleted (with its OTP).
  const staleUser = await prisma.user.create({
    data: {
      name: 'Stale',
      email: staleUnverified,
      password: passwordHash,
      role: 'student',
      emailVerified: false,
      createdAt: oldDate,
      studentProfile: { create: {} },
      emailVerificationOtp: { create: { otp: '111111', expiresAt: new Date(Date.now() + 600000) } },
    },
  });

  // Fresh, unverified -> should be kept.
  const freshUser = await prisma.user.create({
    data: {
      name: 'Fresh',
      email: freshUnverified,
      password: passwordHash,
      role: 'student',
      emailVerified: false,
      createdAt: recentDate,
      studentProfile: { create: {} },
    },
  });

  // Stale, verified -> should be kept.
  const verifiedUser = await prisma.user.create({
    data: {
      name: 'Verified',
      email: staleVerified,
      password: passwordHash,
      role: 'student',
      emailVerified: true,
      createdAt: oldDate,
      studentProfile: { create: {} },
    },
  });

  console.log('\nRunning cleanup...');
  const result = await cleanupUnverifiedAccounts();
  console.log(`Deleted ${result.deleted} account(s) (cutoff ${result.cutoff.toISOString()})`);

  const staleAfter = await prisma.user.findUnique({ where: { id: staleUser.id } });
  const freshAfter = await prisma.user.findUnique({ where: { id: freshUser.id } });
  const verifiedAfter = await prisma.user.findUnique({ where: { id: verifiedUser.id } });
  const orphanOtp = await prisma.emailVerificationOTP.findUnique({ where: { userId: staleUser.id } });

  if (staleAfter === null) ok('stale unverified user was deleted');
  else fail('stale unverified user should have been deleted');

  if (freshAfter !== null) ok('fresh unverified user was kept');
  else fail('fresh unverified user should have been kept');

  if (verifiedAfter !== null) ok('verified (stale) user was kept');
  else fail('verified user should have been kept');

  if (orphanOtp === null) ok('orphaned OTP record was removed with the user');
  else fail('OTP record should have been removed');

  if (result.deleted === 1) ok('exactly one account was deleted (the stale unverified user)');
  else fail('expected exactly 1 deletion', result.deleted);

  // Cleanup test data.
  await prisma.user.deleteMany({
    where: { email: { in: [staleUnverified, freshUnverified, staleVerified] } },
  });

  console.log(`\n${failed === 0 ? 'ALL PASSED' : 'FAILURES PRESENT'} — passed: ${passed}, failed: ${failed}\n`);
  process.exit(failed === 0 ? 0 : 1);
};

main().catch((err) => {
  console.error('Cleanup test crashed:', err);
  process.exit(1);
});
