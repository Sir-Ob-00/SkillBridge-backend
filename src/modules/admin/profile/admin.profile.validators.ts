import { z } from 'zod';

export const adminUpdateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type AdminUpdateProfileInput = z.infer<typeof adminUpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
