import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';

export const portfolioService = {
  async list(query: { page: number; pageSize: number; artisanId?: string }) {
    const skip = (query.page - 1) * query.pageSize;
    const where: any = {};
    if (query.artisanId) {
      const profile = await prisma.artisanProfile.findUnique({ where: { userId: query.artisanId } });
      if (!profile) throw ApiError.notFound('Artisan not found');
      where.artisanProfileId = profile.id;
    }

    const [items, totalItems] = await Promise.all([
      prisma.artisanPortfolio.findMany({ where, skip, take: query.pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.artisanPortfolio.count({ where }),
    ]);

    return {
      items,
      meta: { page: query.page, pageSize: query.pageSize, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) },
    };
  },

  async remove(id: string) {
    const item = await prisma.artisanPortfolio.findUnique({ where: { id } });
    if (!item) throw ApiError.notFound('Portfolio item not found');
    return prisma.artisanPortfolio.delete({ where: { id } });
  },
};
