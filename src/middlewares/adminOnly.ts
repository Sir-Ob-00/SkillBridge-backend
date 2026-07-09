import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';

export const adminOnly = async (req: Request, _res: Response, next: NextFunction) => {
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
};
