import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { authService } from './auth.service';
import { assessPasswordStrength } from '../../utils/validators';
import {
  RegisterInput,
  LoginInput,
  RefreshInput,
  LogoutInput,
  VerifyEmailInput,
  ResendEmailOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  PasswordStrengthInput,
} from './auth.validators';

export const authController = {
  register: asyncHandler(async (req: Request<unknown, unknown, RegisterInput>, res: Response) => {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, 'Account created successfully. Please verify your email.', 201);
  }),

  login: asyncHandler(async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, 'Logged in successfully.');
  }),

  refresh: asyncHandler(async (req: Request<unknown, unknown, RefreshInput>, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken);
    return sendSuccess(res, result, 'Token refreshed successfully.');
  }),

  logout: asyncHandler(async (req: Request<unknown, unknown, LogoutInput>, res: Response) => {
    const result = await authService.logout(req.body.refreshToken);
    return sendSuccess(res, null, result.message);
  }),

  verifyEmail: asyncHandler(
    async (req: Request<unknown, unknown, VerifyEmailInput>, res: Response) => {
      const result = await authService.verifyEmail(req.body);
      return sendSuccess(res, null, result.message);
    }
  ),

  resendEmailOtp: asyncHandler(
    async (req: Request<unknown, unknown, ResendEmailOtpInput>, res: Response) => {
      const result = await authService.resendEmailOtp(req.body);
      return sendSuccess(res, null, result.message);
    }
  ),

  forgotPassword: asyncHandler(
    async (req: Request<unknown, unknown, ForgotPasswordInput>, res: Response) => {
      const result = await authService.forgotPassword(req.body);
      return sendSuccess(res, result, result.message);
    }
  ),

  resetPassword: asyncHandler(
    async (req: Request<unknown, unknown, ResetPasswordInput>, res: Response) => {
      const result = await authService.resetPassword(req.body);
      return sendSuccess(res, result, result.message);
    }
  ),

  checkPasswordStrength: asyncHandler(
    async (req: Request<unknown, unknown, PasswordStrengthInput>, res: Response) => {
      const result = assessPasswordStrength(req.body.password);
      return sendSuccess(res, result);
    }
  ),
};
