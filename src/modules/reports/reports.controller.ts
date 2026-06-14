import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { reportsService } from './reports.service';
import {
  CreateReportInput,
  UpdateReportStatusInput,
  ListReportsQuery,
  ReportIdParam,
} from './reports.validators';

export const reportsController = {
  create: asyncHandler(async (req: Request<unknown, unknown, CreateReportInput>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const report = await reportsService.create(req.user.id, req.body);
    return sendSuccess(res, report, 'Report submitted.', 201);
  }),

  list: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListReportsQuery>, res: Response) => {
      const { items, meta } = await reportsService.list(req.query);
      return sendPaginated(res, items, meta);
    }
  ),

  updateStatus: asyncHandler(
    async (req: Request<ReportIdParam, unknown, UpdateReportStatusInput>, res: Response) => {
      const report = await reportsService.updateStatus(req.params.id, req.body.status);
      return sendSuccess(res, report, 'Report status updated.');
    }
  ),
};
