import { z } from 'zod';
import { Role } from '@prisma/client';

export const createNotificationSchema = z.object({
  title: z.string().trim().min(2).max(160),
  message: z.string().trim().min(2).max(1000),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  targetUserId: z.string().uuid().optional(),
  targetRole: z.nativeEnum(Role).optional(),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().trim().min(2).max(160),
  message: z.string().trim().min(2).max(1000),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  audience: z.enum(['all', 'students', 'artisans', 'admins']).default('all'),
  userIds: z.array(z.string().uuid()).max(500).optional(),
  categoryId: z.string().uuid().optional(),
});

export const markReadSchema = z.object({
  read: z.boolean().default(true),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
