import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { prisma } from '../../../config/prisma';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['student', 'artisan', 'admin', 'super_admin']).optional(),
  search: z.string().trim().optional(),
});

export const userIdParamSchema = z.object({ id: z.string().uuid() });

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;

export const usersController = {
  list: asyncHandler(async (req: any, res: Response) => {
    const { page, pageSize, role, search } = req.query;
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (role) where.role = role;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [items, totalItems] = await Promise.all([
      prisma.user.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);

    return sendPaginated(res, items, { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) });
  }),

  getById: asyncHandler(async (req: any, res: Response) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw ApiError.notFound('User not found');
    return sendSuccess(res, user);
  }),

  suspend: asyncHandler(async (req: any, res: Response) => {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { isSuspended: true } });
    return sendSuccess(res, user, 'User suspended.');
  }),

  unsuspend: asyncHandler(async (req: any, res: Response) => {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { isSuspended: false } });
    return sendSuccess(res, user, 'User unsuspended.');
  }),

  remove: asyncHandler(async (req: any, res: Response) => {
    await prisma.user.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'User deleted.');
  }),
};
