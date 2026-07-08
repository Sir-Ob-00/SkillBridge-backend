import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminAuthService } from './admin.auth.service';
import { LoginInput } from '../../auth/auth.validators';

export const adminAuthController = {
  login: asyncHandler(async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
    const result = await adminAuthService.login(req.body);
    return sendSuccess(res, result, 'Admin logged in successfully.');
  }),
};
