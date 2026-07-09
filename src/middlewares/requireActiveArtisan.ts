import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { ArtisanProfile } from '@prisma/client';

export const requireActiveArtisan = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const profile = (req as any).artisanProfile as (ArtisanProfile | undefined);

  if (!profile) {
    const found = await prisma.artisanProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!found) {
      throw ApiError.notFound('Artisan profile not found.');
    }
    (req as any).artisanProfile = found;
  }

  const target = (req as any).artisanProfile as ArtisanProfile;

  if (target.applicationStatus !== ApplicationStatus.ACTIVE) {
    throw ApiError.forbidden(
      'Your artisan profile is not yet active. Complete onboarding and wait for approval.'
    );
  }

  if (target.isSuspended) {
    throw ApiError.forbidden('Your artisan account has been suspended.');
  }

  next();
};
