import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { adminReportsService } from './admin.reports.service';
import {
  UpdateReportStatusInput,
  ListReportsQuery,
  ReportIdParam,
} from '../../reports/reports.validators';

export const adminReportsController = {
  list: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListReportsQuery>, res: Response) => {
      const { items, meta } = await adminReportsService.list(req.query);
      return sendPaginated(res, items, meta);
    }
  ),

  updateStatus: asyncHandler(
    async (req: Request<ReportIdParam, unknown, UpdateReportStatusInput>, res: Response) => {
      const report = await adminReportsService.updateStatus(req.params.id, req.body.status);
      return sendSuccess(res, report, 'Report status updated.');
    }
  ),
};
