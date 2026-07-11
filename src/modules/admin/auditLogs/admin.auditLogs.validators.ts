import { z } from 'zod';

export const listAuditLogsQuerySchema = z.object({
  resource: z.string().trim().optional(),
  action: z.string().trim().optional(),
  adminId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const auditLogIdParamSchema = z.object({
  id: z.string().uuid('Invalid audit log id'),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
export type AuditLogIdParam = z.infer<typeof auditLogIdParamSchema>;
