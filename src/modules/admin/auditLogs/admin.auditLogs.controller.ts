import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminAuditLogsService } from './admin.auditLogs.service';
import { listAuditLogsQuerySchema, auditLogIdParamSchema } from './admin.auditLogs.validators';
import { validate } from '../../../middlewares/validate';

export const adminAuditLogsController = {
  list: [
    validate(listAuditLogsQuerySchema, 'query'),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminAuditLogsService.list(req.query as any);
      return sendSuccess(res, result);
    }),
  ],

  getById: [
    validate(auditLogIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const log = await adminAuditLogsService.getById(req.params.id);
      if (!log) {
        return sendSuccess(res, null, 'Audit log not found.');
      }
      return sendSuccess(res, log);
    }),
  ],

  export: asyncHandler(async (_req: Request, res: Response) => {
    const logs = await adminAuditLogsService.export();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
    return res.status(200).json({ success: true, data: logs });
  }),
};
