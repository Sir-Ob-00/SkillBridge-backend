import { z } from 'zod';

export const listApplicationsQuerySchema = z.object({
  status: z
    .enum([
      'PENDING_PROFILE',
      'PENDING_REVIEW',
      'UNDER_REVIEW',
      'CHANGES_REQUESTED',
      'ACTIVE',
      'REJECTED',
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const applicationIdParamSchema = z.object({
  id: z.string().uuid('Invalid application id'),
});

export const approveApplicationSchema = z.object({
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const rejectApplicationSchema = z.object({
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(2000),
});

export const requestChangesSchema = z.object({
  notes: z.string().trim().min(5, 'Notes must be at least 5 characters').max(1000),
});

export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;
export type ApplicationIdParam = z.infer<typeof applicationIdParamSchema>;
export type ApproveApplicationInput = z.infer<typeof approveApplicationSchema>;
export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;
export type RequestChangesInput = z.infer<typeof requestChangesSchema>;
