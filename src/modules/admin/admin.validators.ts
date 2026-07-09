import { z } from 'zod';

export const approveArtisanSchema = z.object({
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const rejectArtisanSchema = z.object({
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(2000),
});

export const requestChangesSchema = z.object({
  changes: z.string().trim().min(5, 'Requested changes must be at least 5 characters').max(2000),
});

export const artisanIdParamSchema = z.object({
  id: z.string().uuid('Invalid artisan profile id'),
});

export const listPendingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ApproveArtisanInput = z.infer<typeof approveArtisanSchema>;
export type RejectArtisanInput = z.infer<typeof rejectArtisanSchema>;
export type RequestChangesInput = z.infer<typeof requestChangesSchema>;
export type ListPendingQuery = z.infer<typeof listPendingQuerySchema>;
export type ArtisanIdParam = z.infer<typeof artisanIdParamSchema>;
