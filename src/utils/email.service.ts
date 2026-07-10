import { env } from '../config/env';
import { EmailVerificationOTP, User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { randomInt } from 'crypto';

const OTP_EXPIRY_MS = 10 * 60 * 1000;

const generateOtp = () => randomInt(0, 999999).toString().padStart(6, '0');

const ensureOtp = async (userId: string): Promise<EmailVerificationOTP> => {
  const existing = await prisma.emailVerificationOTP.findUnique({ where: { userId } });
  if (existing && existing.verifiedAt) {
    throw ApiError.badRequest('Email is already verified.');
  }

  const now = new Date();
  const canResend = !existing || existing.expiresAt < now;

  if (!canResend) {
    throw ApiError.badRequest('Please wait before requesting another OTP.');
  }

  const otp = generateOtp();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

  return prisma.emailVerificationOTP.upsert({
    where: { userId },
    create: { userId, otp, expiresAt },
    update: { otp, expiresAt, verifiedAt: null },
  });
};

export const emailService = {
  async sendVerificationOtp(user: Pick<User, 'id' | 'name' | 'email'>) {
    const otpRecord = await ensureOtp(user.id);

    if (env.isProduction) {
      return {
        message: 'A verification code has been sent to your email.',
      };
    }

    return {
      message: 'A verification code has been sent to your email.',
      devOtp: otpRecord.otp,
    };
  },

  async verifyEmail(email: string, otp: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw ApiError.badRequest('Invalid email or OTP.');
    }

    const record = await prisma.emailVerificationOTP.findUnique({ where: { userId: user.id } });
    if (!record || record.verifiedAt) {
      throw ApiError.badRequest('Invalid email or OTP.');
    }

    if (record.otp !== otp) {
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

    return { success: true, message: 'Email verified successfully.' };
  },
};
