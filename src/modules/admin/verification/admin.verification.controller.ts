import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminVerificationService } from './admin.verification.service';
import { ListVerificationsQuery, ArtisanIdParam, ReviewNoteInput } from './admin.verification.validators';

export const adminVerificationController = {
  list: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListVerificationsQuery>, res: Response) => {
      const { items, meta } = await adminVerificationService.list(req.query);
      return sendSuccess(res, { items, meta });
    }
  ),

  getById: asyncHandler(async (req: Request<ArtisanIdParam>, res: Response) => {
    const profile = await adminVerificationService.getById(req.params.id);
    return sendSuccess(res, profile);
  }),

  approve: asyncHandler(
    async (req: Request<ArtisanIdParam, unknown, ReviewNoteInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const profile = await adminVerificationService.approve(req.params.id, req.body?.note, req.user.id);
      return sendSuccess(res, profile, 'Artisan approved. Account is now ACTIVE.');
    }
  ),

  reject: asyncHandler(
    async (req: Request<ArtisanIdParam, unknown, ReviewNoteInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const profile = await adminVerificationService.reject(
        req.params.id,
        req.body?.note ?? 'Rejected by admin',
        req.user.id
      );
      return sendSuccess(res, profile, 'Artisan application rejected.');
    }
  ),

  requestChanges: asyncHandler(
    async (req: Request<ArtisanIdParam, unknown, ReviewNoteInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const profile = await adminVerificationService.requestChanges(
        req.params.id,
        req.body?.note ?? 'Changes requested by admin',
        req.user.id
      );
      return sendSuccess(res, profile, 'Changes requested from artisan.');
    }
  ),
};
