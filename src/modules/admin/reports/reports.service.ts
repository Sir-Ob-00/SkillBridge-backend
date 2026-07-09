import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { ReportStatus } from '@prisma/client';

export const reportsService = {
  async list(query: { page: number; pageSize: number; status?: string }) {
    const skip = (query.page - 1) * query.pageSize;
    const where: any = {};
    if (query.status) where.status = query.status;

    const [items, totalItems] = await Promise.all([
      prisma.report.findMany({ where, skip, take: query.pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.report.count({ where }),
    ]);

    return {
      items,
      meta: { page: query.page, pageSize: query.pageSize, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) },
    };
  },

  async updateStatus(id: string, status: string) {
    return prisma.report.update({ where: { id }, data: { status: status as ReportStatus } });
  },
};
