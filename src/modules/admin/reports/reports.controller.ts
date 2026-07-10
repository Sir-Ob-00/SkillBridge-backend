import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';
import { reportsService } from './reports.service';

export const reportIdParamSchema = z.object({ id: z.string().uuid() });
export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['open', 'resolved', 'escalated']).optional(),
});

export type ReportIdParam = z.infer<typeof reportIdParamSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

export const reportsController = {
  list: asyncHandler(async (req: any, res: Response) => {
    const { items, meta } = await reportsService.list(req.query);
    return sendPaginated(res, items, meta);
  }),

  updateStatus: asyncHandler(async (req: any, res: Response) => {
    const report = await reportsService.updateStatus(req.params.id, req.body.status);
    return sendSuccess(res, report, 'Report status updated.');
  }),
};
