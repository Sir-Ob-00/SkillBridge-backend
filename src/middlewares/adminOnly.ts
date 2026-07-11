import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

export const adminOnly = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  logger.info('[AUTH DEBUG] adminOnly', {
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
  });

  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { role: true, isSuspended: true },
  });

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    throw ApiError.forbidden('Admin access required.');
  }

  if (user.isSuspended) {
    throw ApiError.forbidden('Your account has been suspended.');
  }

  next();
});
