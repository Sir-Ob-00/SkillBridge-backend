import nodemailer from 'nodemailer';
import * as dns from 'dns';
import { env } from '../config/env';
import { EmailVerificationOTP, User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { generateOTP } from './generateOTP';

const OTP_EXPIRY_MS = 10 * 60 * 1000;

// Gmail: 465 = implicit TLS (secure), 587 = STARTTLS. Derive the mode from
// the port so the transporter works whether EMAIL_PORT is 465 or 587.
const useImplicitTls = env.EMAIL_PORT === 465;

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

// Lazily build (and cache) the transporter. We resolve the SMTP host to an
// IPv4 address because Nodemailer resolves both A and AAAA records and then
// randomly picks one; on hosts without IPv6 routes (e.g. Render) it can select
// an unreachable IPv6 address (ENETUNREACH). Pinning IPv4 avoids that.
let transporterPromise: Promise<MailTransporter> | null = null;

const getTransporter = (): Promise<MailTransporter> => {
  if (!transporterPromise) {
    transporterPromise = new Promise<MailTransporter>((resolve) => {
      const host = env.EMAIL_HOST;
      const build = (resolvedHost: string) =>
        nodemailer.createTransport({
          host: resolvedHost,
          port: env.EMAIL_PORT,
          secure: useImplicitTls,
          requireTLS: !useImplicitTls,
          // Keep the real hostname for TLS SNI / certificate validation when
          // we substitute the resolved IPv4 address above.
          tls: { servername: host },
          auth: {
            user: env.EMAIL_USER,
            pass: env.EMAIL_PASS,
          },
          // Fail fast on unreachable / slow SMTP servers instead of hanging requests.
          connectionTimeout: env.EMAIL_TIMEOUT_MS,
          greetingTimeout: env.EMAIL_TIMEOUT_MS,
          socketTimeout: env.EMAIL_TIMEOUT_MS,
        });

      if (!host) {
        resolve(build(host));
        return;
      }

      dns.lookup(host, { family: 4 }, (err, address) => {
        // On resolution failure, fall back to the original hostname so
        // Nodemailer can attempt its own (dual-stack) resolution.
        resolve(build(err || !address ? host : address));
      });
    });
  }
  return transporterPromise;
};

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
  const mailOptions = {
    from: env.EMAIL_FROM || env.EMAIL_USER,
    to: email,
    subject: 'SkillBridge - Verify Your Email',
    html: `
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
    `,
  };

  try {
    const transporter = await getTransporter();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    const e = error as { message?: string; code?: string; command?: string; response?: string };
    // Surface the underlying SMTP failure in the server logs (not to the client)
    // so production email issues are diagnosable.
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
      // Roll back the OTP we just created so a failed delivery doesn't leave a
      // dangling, unverifiable record behind.
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
      // Clean up the OTP once verification succeeds so it can't be reused.
      prisma.emailVerificationOTP.delete({
        where: { id: record.id },
      }),
    ]);

    return { success: true, message: 'Email verified successfully.' };
  },
};
