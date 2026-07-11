import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminProfileService } from './admin.profile.service';
import { adminUpdateProfileSchema, changePasswordSchema } from './admin.profile.validators';
import { validate } from '../../../middlewares/validate';
import { recordAudit, getClientIp } from '../../../utils/audit';
import { imageUpload } from '../../users/upload';

export const adminProfileController = {
  getMyProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const profile = await adminProfileService.getMyProfile(req.user.id);
    return sendSuccess(res, profile);
  }),

  updateMyProfile: [
    validate(adminUpdateProfileSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await adminProfileService.updateMyProfile(req.user.id, req.body);
      await recordAudit({
        adminId: req.user.id,
        action: 'UPDATE',
        resource: 'admin',
        resourceId: req.user.id,
        ipAddress: getClientIp(req),
        newValue: req.body,
      });
      return sendSuccess(res, updated, 'Profile updated successfully.');
    }),
  ],

  changePassword: [
    validate(changePasswordSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const result = await adminProfileService.changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      await recordAudit({
        adminId: req.user.id,
        action: 'UPDATE',
        resource: 'admin_password',
        resourceId: req.user.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, result, result.message);
    }),
  ],

  updateAvatar: [
    imageUpload.single('avatar'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const updated = await adminProfileService.updateAvatar(req.user.id, (req as any).file);
      await recordAudit({
        adminId: req.user.id,
        action: 'UPDATE',
        resource: 'admin_avatar',
        resourceId: req.user.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, updated, 'Avatar updated successfully.');
    }),
  ],
};
