import { Resend } from 'resend';
import { env } from '../config/env';
import { EmailVerificationOTP, User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { generateOTP } from './generateOTP';

const OTP_EXPIRY_MS = 10 * 60 * 1000;

const resend = new Resend(env.RESEND_API_KEY);

const ensureOtp = async (userId: string): Promise<EmailVerificationOTP> => {
  const existing = await prisma.emailVerificationOTP.findUnique({ where: { userId } });
  if (existing && existing.verifiedAt) {
    throw ApiError.badRequest('Email is already verified.');
  }

  const now = new Date();
  const otp = generateOTP();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

  return prisma.emailVerificationOTP.upsert({
    where: { userId },
    create: { userId, otp, expiresAt },
    update: { otp, expiresAt, verifiedAt: null },
  });
};

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">SkillBridge Email Verification</h2>
      <p>Thank you for registering with SkillBridge. Please use the following OTP to verify your email address:</p>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #2563eb; letter-spacing: 8px; font-size: 32px; margin: 0;">${otp}</h1>
      </div>
      <p style="color: #6b7280;">This OTP will expire in <strong>10 minutes</strong>.</p>
      <p style="color: #6b7280;">If you did not request this verification, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #9ca3af; font-size: 12px;">SkillBridge Team</p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'SkillBridge - Verify Your Email',
      html,
    });

    if (error) {
      console.error('[email] OTP send failed:', error);
      throw ApiError.internal('Failed to send verification email. Please try again later.');
    }
  } catch (error) {
    const e = error as { message?: string; code?: string; command?: string; response?: string };
    console.error('[email] OTP send failed:', {
      message: e.message,
      code: e.code,
      command: e.command,
      response: e.response,
    });
    throw ApiError.internal('Failed to send verification email. Please try again later.');
  }
};

export const emailService = {
  async sendVerificationOtp(user: Pick<User, 'id' | 'name' | 'email'>) {
    const otpRecord = await ensureOtp(user.id);

    try {
      await sendOTPEmail(user.email, otpRecord.otp);
    } catch (error) {
      await prisma.emailVerificationOTP.deleteMany({ where: { userId: user.id } }).catch(() => {});
      throw ApiError.internal('Unable to send verification email. Please try again.');
    }

    return {
      message: 'A verification code has been sent to your email.',
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
      prisma.emailVerificationOTP.delete({
        where: { id: record.id },
      }),
    ]);

    return { success: true, message: 'Email verified successfully.' };
  },
};
