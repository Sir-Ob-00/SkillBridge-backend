import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';

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

/**
 * Verifies the Bearer access token and attaches `req.user`.
 * Throws 401 if missing/invalid/expired.
 */
export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization;

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
      throw ApiError.unauthorized('Account is no longer active.');
    }

    req.user = { id: dbUser.id, role: dbUser.role };
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
};

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
