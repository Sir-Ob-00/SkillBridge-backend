import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';
import { auditLogsService } from './auditLogs.service';

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  adminId: z.string().uuid().optional(),
  action: z.string().trim().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

export const auditLogsController = {
  list: asyncHandler(async (req: any, res: Response) => {
    const { items, meta } = await auditLogsService.list(req.query);
    return sendPaginated(res, items, meta);
  }),
};
