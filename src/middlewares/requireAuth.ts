import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization;

  const maskedHeader = header ? header.slice(0, 15) + (header.length > 15 ? '...' : '') : null;

  logger.info('[AUTH DEBUG] requireAuth', {
    method: req.method,
    url: req.originalUrl,
    authHeaderPresent: !!header,
    authHeaderValue: maskedHeader,
    scheme: header?.startsWith('Bearer ') ? 'Bearer' : 'invalid',
  });

  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verifyAccessToken(token);
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isSuspended: true },
    });

    if (!dbUser || dbUser.isSuspended) {
      logger.warn('[AUTH DEBUG] Account suspended or not found', { userId: payload.sub });
      throw ApiError.unauthorized('Account is no longer active.');
    }

    req.user = { id: dbUser.id, role: dbUser.role };
    logger.info('[AUTH DEBUG] JWT verification succeeded', { userId: dbUser.id, role: dbUser.role });
    next();
  } catch {
    logger.warn('[AUTH DEBUG] JWT verification failed');
    throw ApiError.unauthorized('Invalid or expired access token');
  }
});

/**
 * Like requireAuth, but does not throw if no token is present.
 * Useful for routes that behave differently for authenticated vs anonymous users.
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verifyAccessToken(token);
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isSuspended: true },
    });

    if (dbUser && !dbUser.isSuspended) {
      req.user = { id: dbUser.id, role: dbUser.role };
    }
  } catch {
    // ignore invalid token for optional auth
  }

  next();
};
