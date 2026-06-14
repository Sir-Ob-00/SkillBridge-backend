import { z } from 'zod';
import { ReportStatus } from '@prisma/client';

export const createReportSchema = z.object({
  targetUserId: z.string().uuid('Invalid target user id'),
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().max(1000).optional(),
});

export const updateReportStatusSchema = z.object({
  status: z.nativeEnum(ReportStatus),
});

export const listReportsQuerySchema = z.object({
  status: z.nativeEnum(ReportStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const reportIdParamSchema = z.object({
  id: z.string().uuid('Invalid report id'),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type ReportIdParam = z.infer<typeof reportIdParamSchema>;
