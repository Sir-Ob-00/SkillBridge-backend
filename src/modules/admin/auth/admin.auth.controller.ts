import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminAuthService } from './admin.auth.service';
import {
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../auth/auth.validators';
import { validate } from '../../../middlewares/validate';
import { recordAudit, getClientIp } from '../../../utils/audit';
import { prisma } from '../../../config/prisma';

export const adminAuthController = {
  login: [
    validate(loginSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminAuthService.login(req.body);
      const user = await prisma.user.findUnique({
        where: { email: req.body.email },
        select: { id: true },
      });
      await recordAudit({
        adminId: user?.id,
        action: 'LOGIN',
        resource: 'admin',
        resourceId: user?.id,
        ipAddress: getClientIp(req),
        newValue: { email: req.body.email },
      });
      return sendSuccess(res, result, 'Admin logged in successfully.');
    }),
  ],

  refresh: [
    validate(refreshSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminAuthService.refresh(req.body.refreshToken);
      return sendSuccess(res, result, 'Token refreshed successfully.');
    }),
  ],

  logout: [
    validate(logoutSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminAuthService.logout(req.body.refreshToken);
      if (req.user) {
        await recordAudit({
          adminId: req.user.id,
          action: 'LOGOUT',
          resource: 'admin',
          resourceId: req.user.id,
          ipAddress: getClientIp(req),
        });
      }
      return sendSuccess(res, null, result.message);
    }),
  ],

  forgotPassword: [
    validate(forgotPasswordSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminAuthService.forgotPassword(req.body);
      return sendSuccess(res, result, result.message);
    }),
  ],

  resetPassword: [
    validate(resetPasswordSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminAuthService.resetPassword(req.body);
      return sendSuccess(res, result, result.message);
    }),
  ],

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const admin = await adminAuthService.me(req.user.id);
    return sendSuccess(res, admin);
  }),
};
