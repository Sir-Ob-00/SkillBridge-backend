import { z } from 'zod';
import { strongPasswordSchema, phoneSchema } from '../../../utils/validators';

export const adminUpdateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: phoneSchema.optional(),
  avatarUrl: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: strongPasswordSchema,
});

export type AdminUpdateProfileInput = z.infer<typeof adminUpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
