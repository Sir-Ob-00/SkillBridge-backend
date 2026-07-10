import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';

export const auditLogsService = {
  async list(query: { page: number; pageSize: number; adminId?: string; action?: string }) {
    const skip = (query.page - 1) * query.pageSize;
    const where: any = {};
    if (query.adminId) where.changedByUserId = query.adminId;
    if (query.action) where.notes = { contains: query.action, mode: 'insensitive' };

    const [items, totalItems] = await Promise.all([
      prisma.artisanStatusChange.findMany({ where, skip, take: query.pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.artisanStatusChange.count({ where }),
    ]);

    return {
      items,
      meta: { page: query.page, pageSize: query.pageSize, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) },
    };
  },
};
