import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';

export const reviewsService = {
  async list(query: { page: number; pageSize: number }) {
    const skip = (query.page - 1) * query.pageSize;
    const [items, totalItems] = await Promise.all([
      prisma.review.findMany({ skip, take: query.pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.review.count(),
    ]);

    return {
      items,
      meta: { page: query.page, pageSize: query.pageSize, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) },
    };
  },

  async remove(id: string) {
    return prisma.review.delete({ where: { id } });
  },

  async flag(id: string) {
    return prisma.review.update({ where: { id }, data: { isFlagged: true } });
  },
};
