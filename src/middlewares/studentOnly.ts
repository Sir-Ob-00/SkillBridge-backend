import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/prisma';

export const studentOnly = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { role: true, isSuspended: true },
  });

  if (!user || user.role !== 'student') {
    throw ApiError.forbidden('Student access required.');
  }

  if (user.isSuspended) {
    throw ApiError.forbidden('Your account has been suspended.');
  }

  next();
};
