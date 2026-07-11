import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminReportsService } from './admin.reports.service';
import {
  UpdateReportStatusInput,
  ListReportsQuery,
  ReportIdParam,
} from '../../reports/reports.validators';
import { validate } from '../../../middlewares/validate';
import { recordAudit, getClientIp } from '../../../utils/audit';
import { notifyUser } from '../../../utils/notify';

export const adminReportsController = {
  list: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListReportsQuery>, res: Response) => {
      const result = await adminReportsService.list(req.query);
      return sendPaginated(res, result.items, result.meta);
    }
  ),

  statistics: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminReportsService.statistics();
    return sendSuccess(res, stats);
  }),

  export: asyncHandler(async (_req: Request, res: Response) => {
    const rows = await adminReportsService.export();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="reports.json"');
    return res.status(200).json({ success: true, data: rows });
  }),

  getById: asyncHandler(
    async (req: Request<ReportIdParam>, res: Response) => {
      const report = await adminReportsService.getById(req.params.id);
      return sendSuccess(res, report);
    }
  ),

  updateStatus: asyncHandler(
    async (req: Request<ReportIdParam, unknown, UpdateReportStatusInput>, res: Response) => {
      const report = await adminReportsService.updateStatus(req.params.id, req.body.status);
      await recordAudit({
        adminId: req.user?.id,
        action: 'UPDATE_STATUS',
        resource: 'report',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: req.body,
      });
      return sendSuccess(res, report, 'Report status updated.');
    }
  ),

  assign: asyncHandler(
    async (req: Request<ReportIdParam>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const report = await adminReportsService.assign(req.params.id, req.user.id);
      await recordAudit({
        adminId: req.user.id,
        action: 'ASSIGN',
        resource: 'report',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, report, 'Report assigned to you.');
    }
  ),

  resolve: asyncHandler(
    async (req: Request<ReportIdParam, unknown, { resolution?: string }>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const report = await adminReportsService.resolve(req.params.id, req.user.id, req.body.resolution);
      await notifyUser(report.reporterId, 'Report resolved', 'The report you filed has been resolved by an administrator.');
      await recordAudit({
        adminId: req.user.id,
        action: 'RESOLVE',
        resource: 'report',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: { resolution: req.body.resolution },
      });
      return sendSuccess(res, report, 'Report resolved.');
    }
  ),

  dismiss: asyncHandler(
    async (req: Request<ReportIdParam>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const report = await adminReportsService.dismiss(req.params.id, req.user.id);
      await recordAudit({
        adminId: req.user.id,
        action: 'DISMISS',
        resource: 'report',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, report, 'Report dismissed.');
    }
  ),

  addNote: asyncHandler(
    async (req: Request<ReportIdParam, unknown, { note: string }>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const report = await adminReportsService.addNote(req.params.id, req.body.note);
      await recordAudit({
        adminId: req.user.id,
        action: 'UPDATE',
        resource: 'report',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: { note: req.body.note },
      });
      return sendSuccess(res, report, 'Note added to report.');
    }
  ),
};
