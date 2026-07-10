import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(Role).default(Role.student),
  phone: z.string().trim().min(7).max(20).optional(),
}).superRefine((data, ctx) => {
  if (data.role === Role.artisan && !data.phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['phone'],
      message: 'Phone number is required for artisans.',
    });
  }
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const resendEmailOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendEmailOtpInput = z.infer<typeof resendEmailOtpSchema>;
