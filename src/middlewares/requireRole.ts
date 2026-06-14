import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

/**
 * Restricts a route to one or more roles. Must run after requireAuth.
 *
 * Usage: router.get('/admin/stats', requireAuth, requireRole(['admin', 'super_admin']), handler)
 */
export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

/** Convenience: admin or super_admin */
export const requireAdmin = requireRole(['admin', 'super_admin']);
