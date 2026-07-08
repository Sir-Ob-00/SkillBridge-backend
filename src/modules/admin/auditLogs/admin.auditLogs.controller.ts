import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminAuditLogsService } from './admin.auditLogs.service';

export const adminAuditLogsController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const logs = await adminAuditLogsService.list();
    return sendSuccess(res, logs);
  }),
};
