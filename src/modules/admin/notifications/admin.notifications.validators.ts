import { z } from 'zod';
import { Role } from '@prisma/client';

export const createNotificationSchema = z.object({
  title: z.string().trim().min(2).max(160),
  message: z.string().trim().min(2).max(1000),
  targetUserId: z.string().uuid().optional(),
  targetRole: z.nativeEnum(Role).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
