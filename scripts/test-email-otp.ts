/**
 * End-to-end verification of the Email OTP flow against a live database.
 *
 * Run with:  npx tsx scripts/test-email-otp.ts
 *
 * Covers:
 *  - Registration fails closed when the verification email cannot be sent
 *    (no orphaned account is left behind).
 *  - The full happy path: register -> verify -> resend -> login, plus the
 *    invalid/expired OTP and login-block checks.
 *
 * The OTP normally arrives by email; here we stub the email transport so the
 * success path is deterministic regardless of SMTP credentials.
 */
import { authService } from '../src/modules/auth/auth.service';
import { emailService } from '../src/utils/email.service';
import { prisma } from '../src/config/prisma';
import { ApiError } from '../src/utils/ApiError';

let passed = 0;
let failed = 0;

const ok = (label: string) => {
  passed += 1;
  console.log(`  ✓ ${label}`);
};

const fail = (label: string, detail: unknown) => {
  failed += 1;
  console.error(`  ✗ ${label}`);
  console.error('    ', detail);
};

const assert = (cond: boolean, label: string) => (cond ? ok(label) : fail(label, 'assertion was false'));

const expectApiError = async (
  fn: () => Promise<unknown>,
  expectedMessage: string,
  label: string
): Promise<void> => {
  try {
    await fn();
    fail(label, `expected ApiError "${expectedMessage}" but call succeeded`);
  } catch (err) {
    if (err instanceof ApiError && err.message === expectedMessage) {
      ok(label);
    } else {
      fail(label, `got ${(err as Error).message ?? err} (expected "${expectedMessage}")`);
    }
  }
};

const getOtp = (userId: string) => prisma.emailVerificationOTP.findUnique({ where: { userId } });

const uid = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;

const main = async () => {
  const email = `otptest_${uid()}@example.com`;
  const password = 'Password123';
  const name = 'OTP Tester';

  // Simulate email delivery failing, then recovery to success afterwards.
  emailService.sendVerificationEmail = async () => false;
  emailService.sendPasswordResetEmail = async () => false;

  console.log('\n[0] Registration fails closed when email delivery fails (no orphan)');
  await expectApiError(
    () => authService.register({ name, email, password, role: 'student' }),
    "We couldn't send the verification email. Please try again later.",
    'register throws the delivery error'
  );
  const orphan = await prisma.user.findUnique({ where: { email } });
  assert(orphan === null, 'no orphaned user remains after a failed send');

  // From here on, simulate successful email delivery.
  emailService.sendVerificationEmail = async () => true;
  emailService.sendPasswordResetEmail = async () => true;
  console.log('\n[1] Successful registration sends an email (OTP stored)');
  const regA = await authService.register({ name, email, password, role: 'student' });
  assert(regA.user != null, 'user is created');
  assert(!('accessToken' in regA) && !('otp' in regA), 'response never includes tokens or OTP');
  const otpA1 = await getOtp(regA.user.id);
  assert(otpA1 != null && /^\d{6}$/.test(otpA1.otp), 'a 6-digit OTP was stored in the database');

  console.log('\n[2] Invalid OTP returns "Invalid email or OTP."');
  await expectApiError(
    () => authService.verifyEmail({ email, otp: '000000' }),
    'Invalid email or OTP.',
    'wrong OTP is rejected'
  );

  console.log('\n[3] Expired OTP returns "OTP has expired. Please request a new one."');
  await prisma.emailVerificationOTP.update({
    where: { id: otpA1!.id },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
  await expectApiError(
    () => authService.verifyEmail({ email, otp: otpA1!.otp }),
    'OTP has expired. Please request a new one.',
    'expired OTP is rejected'
  );

  console.log('\n[4] Resend OTP invalidates the previous OTP');
  await authService.resendEmailOtp({ email });
  const otpA2 = await getOtp(regA.user.id);
  assert(otpA2!.otp !== otpA1!.otp, 'a new OTP replaced the previous one');
  await expectApiError(
    () => authService.verifyEmail({ email, otp: otpA1!.otp }),
    'Invalid email or OTP.',
    'old OTP is now invalid'
  );

  console.log('\n[5] New OTP verifies successfully');
  const verifyRes = await authService.verifyEmail({ email, otp: otpA2!.otp });
  assert(verifyRes.message === 'Email verified successfully.', 'verification succeeds with new OTP');

  console.log('\n[6] emailVerified changes from false to true');
  const userA = await prisma.user.findUniqueOrThrow({
    where: { id: regA.user.id },
    select: { emailVerified: true },
  });
  assert(userA.emailVerified === true, 'emailVerified is true after verification');

  console.log('\n[7] Login is blocked until verification');
  const bEmail = `otptest_b_${uid()}@example.com`;
  const regB = await authService.register({ name, email: bEmail, password, role: 'student' });
  await expectApiError(
    () => authService.login({ email: bEmail, password }),
    'Please verify your email before logging in.',
    'login blocked for unverified user'
  );

  console.log('\n[8] Login succeeds after verification');
  const otpB = await getOtp(regB.user.id);
  await authService.verifyEmail({ email: bEmail, otp: otpB!.otp });
  const loginRes = await authService.login({ email: bEmail, password });
  assert(loginRes.accessToken != null && loginRes.refreshToken != null, 'login issues tokens after verification');

  // Cleanup
  await prisma.user.deleteMany({ where: { email: { in: [email, bEmail] } } });

  console.log(`\n${failed === 0 ? 'ALL PASSED' : 'FAILURES PRESENT'} — passed: ${passed}, failed: ${failed}\n`);
  process.exit(failed === 0 ? 0 : 1);
};

main().catch((err) => {
  console.error('Test harness crashed:', err);
  process.exit(1);
});
