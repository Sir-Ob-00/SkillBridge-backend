import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminStudentsService } from './students.service';
import {
  listStudentsQuerySchema,
  updateStudentSchema,
  studentIdParamSchema,
  studentStatusSchema,
} from './students.validators';
import { validate } from '../../../middlewares/validate';
import { recordAudit, getClientIp } from '../../../utils/audit';
import { notifyUser } from '../../../utils/notify';
import type { ListStudentsQuery } from './students.validators';

export const adminStudentsController = {
  list: [
    validate(listStudentsQuerySchema, 'query'),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminStudentsService.list(req.query as unknown as ListStudentsQuery);
      return sendSuccess(res, result);
    }),
  ],

  statistics: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminStudentsService.statistics();
    return sendSuccess(res, stats);
  }),

  export: asyncHandler(async (_req: Request, res: Response) => {
    const rows = await adminStudentsService.export();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="students.json"');
    return res.status(200).json({ success: true, data: rows });
  }),

  getById: [
    validate(studentIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const student = await adminStudentsService.getById(req.params.id);
      return sendSuccess(res, student);
    }),
  ],

  update: [
    validate(studentIdParamSchema, 'params'),
    validate(updateStudentSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await adminStudentsService.update(req.params.id, req.body);
      await recordAudit({
        adminId: req.user.id,
        action: 'UPDATE',
        resource: 'student',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: req.body,
      });
      return sendSuccess(res, updated, 'Student updated successfully.');
    }),
  ],

  setStatus: [
    validate(studentIdParamSchema, 'params'),
    validate(studentStatusSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await adminStudentsService.suspend(req.params.id, req.body.isSuspended);
      await recordAudit({
        adminId: req.user.id,
        action: req.body.isSuspended ? 'SUSPEND' : 'UNSUSPEND',
        resource: 'student',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: { isSuspended: req.body.isSuspended },
      });
      return sendSuccess(res, updated, 'Student status updated.');
    }),
  ],

  suspend: [
    validate(studentIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await adminStudentsService.suspend(req.params.id, true);
      await notifyUser(req.params.id, 'Account suspended', 'Your account has been suspended by an administrator.');
      await recordAudit({
        adminId: req.user.id,
        action: 'SUSPEND',
        resource: 'student',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, updated, 'Student suspended.');
    }),
  ],

  unsuspend: [
    validate(studentIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await adminStudentsService.suspend(req.params.id, false);
      await notifyUser(req.params.id, 'Account restored', 'Your account has been reactivated.');
      await recordAudit({
        adminId: req.user.id,
        action: 'UNSUSPEND',
        resource: 'student',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, updated, 'Student unsuspended.');
    }),
  ],

  remove: [
    validate(studentIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const result = await adminStudentsService.remove(req.params.id, req.user.id);
      await recordAudit({
        adminId: req.user.id,
        action: 'DELETE',
        resource: 'student',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, result, result.message);
    }),
  ],
};

