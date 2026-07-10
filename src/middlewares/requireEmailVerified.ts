import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

export const requireEmailVerified = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const user = (req as any).user as { emailVerified?: boolean };

  if (!user.emailVerified) {
    throw ApiError.forbidden('Please verify your email before proceeding.', 'EMAIL_NOT_VERIFIED');
  }

  next();
};
