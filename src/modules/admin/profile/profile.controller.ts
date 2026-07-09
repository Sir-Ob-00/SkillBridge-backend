import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { prisma } from '../../../config/prisma';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';

export const updateAdminProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  avatarUrl: z.string().trim().url().optional(),
});

export type UpdateAdminProfileInput = z.infer<typeof updateAdminProfileSchema>;

export const profileController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw ApiError.notFound('Admin profile not found');
    const { password, ...safe } = user as any;
    return sendSuccess(res, safe);
  }),

  update: asyncHandler(async (req: Request<unknown, unknown, UpdateAdminProfileInput>, res: Response) => {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: req.body,
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true, createdAt: true },
    });
    return sendSuccess(res, user, 'Admin profile updated.');
  }),
};
