import { randomUUID } from 'crypto';
import { Role, ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { hashPassword, comparePassword } from '../../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  expiryToDate,
} from '../../utils/jwt';
import { env } from '../../config/env';
import { emailService, generateOtp, OTP_TTL_MS } from '../../utils/email.service';
import {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendEmailOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.validators';

const PUBLIC_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  profileImageUrl: true,
  isSuspended: true,
  createdAt: true,
} as const;

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const issueTokens = async (userId: string, role: Role): Promise<AuthTokens> => {
  const accessToken = signAccessToken({ sub: userId, role });

  // Create the refresh token row first so we can embed its id in the JWT
  // (enables single-token revocation on logout).
  const tokenId = randomUUID();
  const refreshToken = signRefreshToken({ sub: userId, tokenId });

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      token: refreshToken,
      userId,
      expiresAt: expiryToDate(env.JWT_REFRESH_EXPIRES_IN),
    },
  });

  return { accessToken, refreshToken };
};

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(input.password);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Create the user + profile + email OTP atomically. The account is created
    // unverified; the user must confirm their email (via OTP) before logging in.
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: passwordHash,
          role: input.role,
          phone: input.phone,
        },
        select: PUBLIC_USER_FIELDS,
      });

      if (input.role === Role.artisan) {
        await tx.artisanProfile.create({
          data: {
            userId: created.id,
            applicationStatus: ApplicationStatus.PENDING_PROFILE,
          },
        });
      } else if (input.role === Role.student) {
        await tx.studentProfile.create({ data: { userId: created.id } });
      }

      // Store a single active OTP for this user (replace if one already exists).
      await tx.emailVerificationOTP.upsert({
        where: { userId: created.id },
        create: { userId: created.id, otp, expiresAt },
        update: { otp, expiresAt, verifiedAt: null },
      });

      return created;
    });

    // Registration only succeeds if the verification email is delivered.
    // Otherwise we remove the just-created account (and its OTP via cascade)
    // so a failed send never leaves an orphaned, unverified account behind.
    const sent = await emailService.sendVerificationEmail(user.email, user.name, otp);
    if (!sent) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
      throw ApiError.badRequest('We couldn\'t send the verification email. Please try again later.');
    }

    return { user };
  },

  async verifyEmail(input: VerifyEmailInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, emailVerified: true },
    });

    if (!user || user.emailVerified) {
      throw ApiError.badRequest('Invalid email or OTP.');
    }

    const record = await prisma.emailVerificationOTP.findUnique({
      where: { userId: user.id },
    });

    // No record, or the OTP was already consumed, is treated as invalid.
    if (!record || record.verifiedAt) {
      throw ApiError.badRequest('Invalid email or OTP.');
    }

    if (record.otp !== input.otp) {
      throw ApiError.badRequest('Invalid email or OTP.');
    }

    if (record.expiresAt < new Date()) {
      throw ApiError.badRequest('OTP has expired. Please request a new one.');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
      prisma.emailVerificationOTP.update({
        where: { id: record.id },
        data: { verifiedAt: new Date() },
      }),
    ]);

    return { message: 'Email verified successfully.' };
  },

  async resendEmailOtp(input: ResendEmailOtpInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    if (!user) {
      throw ApiError.badRequest('No account found for this email.');
    }

    if (user.emailVerified) {
      throw ApiError.badRequest('Email is already verified.');
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Replace any previous OTP for this user and reset its state so the old
    // code becomes invalid immediately.
    await prisma.emailVerificationOTP.upsert({
      where: { userId: user.id },
      create: { userId: user.id, otp, expiresAt },
      update: { otp, expiresAt, verifiedAt: null },
    });

    await emailService.sendVerificationEmail(user.email, user.name, otp);

    return { message: 'Verification code sent successfully.' };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { ...PUBLIC_USER_FIELDS, password: true, emailVerified: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (user.isSuspended) {
      throw ApiError.forbidden('This account has been suspended.');
    }

    if (!user.emailVerified) {
      throw ApiError.forbidden('Please verify your email before logging in.');
    }

    const passwordMatches = await comparePassword(input.password, user.password);
    if (!passwordMatches) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const tokens = await issueTokens(user.id, user.role);

    const { password: _password, emailVerified: _emailVerified, ...publicUser } = user;

    return { user: publicUser, ...tokens };
  },

  /**
   * Admin dashboard login. Reuses the standard login flow but only issues
   * tokens for accounts with an admin or super_admin role.
   */
  async adminLogin(input: LoginInput) {
    const result = await this.login(input);

    if (result.user.role !== Role.admin && result.user.role !== Role.super_admin) {
      throw ApiError.forbidden('This account is not authorized to access the admin dashboard.');
    }

    return result;
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token.');
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
    });

    if (!stored || stored.revoked || stored.token !== refreshToken) {
      throw ApiError.unauthorized('Refresh token has been revoked.');
    }

    if (stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token has expired.');
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || user.isSuspended) {
      throw ApiError.unauthorized('Account is no longer active.');
    }

    // Rotate: revoke the old token, issue a new pair.
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const tokens = await issueTokens(user.id, user.role);
    return tokens;
  },

  async logout(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { id: payload.tokenId },
        data: { revoked: true },
      });
    } catch {
      // Token already invalid/expired — logout is idempotent either way.
    }

    return { message: 'Logged out successfully.' };
  },

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, name: true, email: true },
    });

    // Always return a generic response to avoid leaking which emails exist.
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const token = randomUUID();
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    if (env.FRONTEND_URL) {
      const resetUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${token}`;
      await emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);
    }

    // In production this would be emailed. For now we surface it so the
    // flow is testable end-to-end without an email provider configured.
    return {
      message: 'If that email exists, a reset link has been sent.',
      ...(env.isProduction ? {} : { devResetToken: token }),
    };
  },

  async resetPassword(input: ResetPasswordInput) {
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token: input.token },
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      throw ApiError.badRequest('This reset link is invalid or has expired.');
    }

    const passwordHash = await hashPassword(input.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
      // Revoke all existing sessions on password reset.
      prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId, revoked: false },
        data: { revoked: true },
      }),
    ]);

    return { message: 'Password has been reset successfully.' };
  },
};
