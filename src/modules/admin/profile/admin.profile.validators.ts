import { z } from 'zod';

export const adminUpdateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

export type AdminUpdateProfileInput = z.infer<typeof adminUpdateProfileSchema>;
