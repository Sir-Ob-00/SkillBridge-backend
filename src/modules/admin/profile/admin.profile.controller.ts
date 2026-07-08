import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminProfileService } from './admin.profile.service';
import { AdminUpdateProfileInput } from './admin.profile.validators';

export const adminProfileController = {
  getMyProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const profile = await adminProfileService.getMyProfile(req.user.id);
    return sendSuccess(res, profile);
  }),

  updateMyProfile: asyncHandler(
    async (req: Request<unknown, unknown, AdminUpdateProfileInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const profile = await adminProfileService.updateMyProfile(req.user.id, req.body);
      return sendSuccess(res, profile, 'Admin profile updated.');
    }
  ),
};
