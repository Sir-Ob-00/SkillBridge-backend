import { createTransport, type Transporter } from 'nodemailer';
import { randomInt } from 'crypto';
import { env } from '../config/env';
import { logger } from './logger';

/** OTP lifetime in milliseconds (10 minutes by default). */
export const OTP_TTL_MS = env.EMAIL_OTP_TTL_MINUTES * 60 * 1000;

const APP_NAME = 'SkillBridge';

/**
 * Generates a secure six-digit numeric OTP.
 * Uses crypto.randomInt so the output is cryptographically unpredictable.
 */
export const generateOtp = (): string => {
  return String(randomInt(100000, 1000000));
};

let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: false,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Sends an email via Brevo SMTP. SMTP failures are swallowed and logged as a
 * warning so that auth flows (register / verify / resend) never crash because
 * of an email outage. The OTP is NEVER logged.
 */
const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    const info = await getTransporter().sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    logger.info('[email] sent email to', to, '(messageId:', info.messageId + ')');
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    logger.warn('[email] failed to send email to', to, '-', message);
    return false;
  }
};

const verificationEmailTemplate = (name: string, otp: string): string => {
  const expiryMinutes = env.EMAIL_OTP_TTL_MINUTES;
  const firstName = name.trim().split(/\s+/)[0] || 'there';
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Verify your email</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f5f7; font-family:Arial, Helvetica, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="background-color:#1f4e79; padding:24px 32px;">
                  <h1 style="margin:0; color:#ffffff; font-size:22px; letter-spacing:0.5px;">${APP_NAME}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <h2 style="margin:0 0 16px; color:#1a1a1a; font-size:20px;">Hello ${firstName},</h2>
                  <p style="margin:0 0 24px; color:#4a4a4a; font-size:15px; line-height:1.6;">
                    Thanks for joining ${APP_NAME}! Use the verification code below to confirm your email
                    address and activate your account.
                  </p>
                  <div style="text-align:center; margin:0 0 24px;">
                    <span style="display:inline-block; font-size:32px; font-weight:bold; letter-spacing:8px; color:#1f4e79; background-color:#eef3f9; padding:16px 24px; border-radius:8px;">
                      ${otp}
                    </span>
                  </div>
                  <p style="margin:0 0 8px; color:#4a4a4a; font-size:14px; line-height:1.6;">
                    This code expires in <strong>${expiryMinutes} minutes</strong>. If you did not create a
                    ${APP_NAME} account, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#fafafa; padding:20px 32px; border-top:1px solid #ececec;">
                  <p style="margin:0; color:#9a9a9a; font-size:12px; text-align:center;">
                    &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
};

const passwordResetEmailTemplate = (name: string, resetUrl: string): string => {
  const firstName = name.trim().split(/\s+/)[0] || 'there';
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reset your password</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f5f7; font-family:Arial, Helvetica, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="background-color:#1f4e79; padding:24px 32px;">
                  <h1 style="margin:0; color:#ffffff; font-size:22px; letter-spacing:0.5px;">${APP_NAME}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <h2 style="margin:0 0 16px; color:#1a1a1a; font-size:20px;">Hello ${firstName},</h2>
                  <p style="margin:0 0 24px; color:#4a4a4a; font-size:15px; line-height:1.6;">
                    We received a request to reset your ${APP_NAME} password. Click the button below to choose
                    a new password. This link expires in 1 hour.
                  </p>
                  <div style="text-align:center; margin:0 0 24px;">
                    <a href="${resetUrl}" style="display:inline-block; background-color:#1f4e79; color:#ffffff; text-decoration:none; font-size:15px; font-weight:bold; padding:14px 28px; border-radius:8px;">
                      Reset Password
                    </a>
                  </div>
                  <p style="margin:0 0 8px; color:#9a9a9a; font-size:13px; line-height:1.6;">
                    If the button does not work, copy and paste this link into your browser:
                    <br />
                    <span style="color:#1f4e79; word-break:break-all;">${resetUrl}</span>
                  </p>
                  <p style="margin:16px 0 0; color:#4a4a4a; font-size:14px; line-height:1.6;">
                    If you did not request a password reset, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#fafafa; padding:20px 32px; border-top:1px solid #ececec;">
                  <p style="margin:0; color:#9a9a9a; font-size:12px; text-align:center;">
                    &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
};

export const emailService = {
  /** Sends the email-verification OTP. Returns true if the send was accepted. */
  sendVerificationEmail(email: string, name: string, otp: string): Promise<boolean> {
    return sendEmail(email, `${APP_NAME} - Verify Your Email`, verificationEmailTemplate(name, otp));
  },

  /** Sends the password-reset email reusing the same transport. */
  sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<boolean> {
    return sendEmail(email, `${APP_NAME} - Reset Your Password`, passwordResetEmailTemplate(name, resetUrl));
  },
};
