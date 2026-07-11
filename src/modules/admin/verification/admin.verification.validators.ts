import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

export const listVerificationsQuerySchema = z.object({
  status: z.nativeEnum(ApplicationStatus).default(ApplicationStatus.PENDING_REVIEW),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const artisanIdParamSchema = z.object({
  id: z.string().uuid('Invalid artisan id'),
});

export const reviewNoteSchema = z.object({
  note: z.string().trim().min(2).max(1000).optional(),
});

export const addNoteSchema = z.object({
  note: z.string().trim().min(2).max(2000),
});

export const verificationStatusSchema = z.object({
  status: z.enum(['verified', 'rejected', 'pending', 'changes']),
});

export type ListVerificationsQuery = z.infer<typeof listVerificationsQuerySchema>;
export type ArtisanIdParam = z.infer<typeof artisanIdParamSchema>;
export type ReviewNoteInput = z.infer<typeof reviewNoteSchema>;
