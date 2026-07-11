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
import {
  RegisterInput,
  LoginInput,
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

    // Create the user + profile atomically. The account is immediately active;
    // no email verification step is required.
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

      return created;
    });

    const tokens = await issueTokens(user.id, user.role);
    return { user, ...tokens };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { ...PUBLIC_USER_FIELDS, password: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (user.isSuspended) {
      throw ApiError.forbidden('This account has been suspended.');
    }

    const passwordMatches = await comparePassword(input.password, user.password);
    if (!passwordMatches) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const tokens = await issueTokens(user.id, user.role);

    const { password: _password, ...publicUser } = user;

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
    const user = await prisma.user.findUnique({ where: { email: input.email } });

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
