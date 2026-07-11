import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminVerificationService } from './admin.verification.service';
import {
  listVerificationsQuerySchema,
  artisanIdParamSchema,
  reviewNoteSchema,
  addNoteSchema,
  verificationStatusSchema,
} from './admin.verification.validators';
import { validate } from '../../../middlewares/validate';
import { recordAudit, getClientIp } from '../../../utils/audit';
import { notifyUser } from '../../../utils/notify';
import { prisma } from '../../../config/prisma';

const artisanUserId = async (artisanId: string): Promise<string | null> => {
  const profile = await prisma.artisanProfile.findUnique({
    where: { id: artisanId },
    select: { userId: true },
  });
  return profile?.userId ?? null;
};

export const adminVerificationController = {
  list: [
    validate(listVerificationsQuerySchema, 'query'),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminVerificationService.list(req.query as any);
      return sendSuccess(res, result);
    }),
  ],

  statistics: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminVerificationService.statistics();
    return sendSuccess(res, stats);
  }),

  getById: [
    validate(artisanIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const profile = await adminVerificationService.getById(req.params.id);
      return sendSuccess(res, profile);
    }),
  ],

  getDocuments: [
    validate(artisanIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const documents = await adminVerificationService.getDocuments(req.params.id);
      return sendSuccess(res, documents);
    }),
  ],

  approve: [
    validate(artisanIdParamSchema, 'params'),
    validate(reviewNoteSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const profile = await adminVerificationService.approve(req.params.id, req.body?.note, req.user.id);
      const userId = await artisanUserId(req.params.id);
      if (userId) {
        await notifyUser(userId, 'Application approved', 'Congratulations! Your artisan application has been approved and you are now visible in the marketplace.');
      }
      await recordAudit({
        adminId: req.user.id,
        action: 'APPROVE',
        resource: 'verification',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: { note: req.body?.note },
      });
      return sendSuccess(res, profile, 'Artisan approved. Account is now ACTIVE.');
    }),
  ],

  reject: [
    validate(artisanIdParamSchema, 'params'),
    validate(reviewNoteSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const note = req.body?.note ?? 'Rejected by admin';
      const profile = await adminVerificationService.reject(req.params.id, note, req.user.id);
      const userId = await artisanUserId(req.params.id);
      if (userId) {
        await notifyUser(userId, 'Application rejected', `Your artisan application was rejected. Reason: ${note}`);
      }
      await recordAudit({
        adminId: req.user.id,
        action: 'REJECT',
        resource: 'verification',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: { note },
      });
      return sendSuccess(res, profile, 'Artisan application rejected.');
    }),
  ],

  requestChanges: [
    validate(artisanIdParamSchema, 'params'),
    validate(reviewNoteSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const note = req.body?.note ?? 'Changes requested by admin';
      const profile = await adminVerificationService.requestChanges(req.params.id, note, req.user.id);
      const userId = await artisanUserId(req.params.id);
      if (userId) {
        await notifyUser(userId, 'Changes requested', `Please update your application. Note: ${note}`);
      }
      await recordAudit({
        adminId: req.user.id,
        action: 'REQUEST_CHANGES',
        resource: 'verification',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: { note },
      });
      return sendSuccess(res, profile, 'Changes requested from artisan.');
    }),
  ],

  addNote: [
    validate(artisanIdParamSchema, 'params'),
    validate(addNoteSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const profile = await adminVerificationService.addNote(req.params.id, req.body.note);
      await recordAudit({
        adminId: req.user.id,
        action: 'UPDATE',
        resource: 'verification_note',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: { note: req.body.note },
      });
      return sendSuccess(res, profile, 'Internal note added.');
    }),
  ],

  setStatus: [
    validate(artisanIdParamSchema, 'params'),
    validate(verificationStatusSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const profile = await adminVerificationService.setStatus(req.params.id, req.body.status);
      await recordAudit({
        adminId: req.user.id,
        action: 'UPDATE_STATUS',
        resource: 'verification',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
        newValue: req.body,
      });
      return sendSuccess(res, profile, 'Verification status updated.');
    }),
  ],
};
