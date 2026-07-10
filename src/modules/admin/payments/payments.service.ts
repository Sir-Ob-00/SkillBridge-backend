import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';

export const paymentsService = {
  async list(query: { page: number; pageSize: number }) {
    const skip = (query.page - 1) * query.pageSize;
    const [items, totalItems] = await Promise.all([
      prisma.booking.findMany({ where: { status: 'completed' }, skip, take: query.pageSize }),
      prisma.booking.count({ where: { status: 'completed' } }),
    ]);

    return {
      items,
      meta: { page: query.page, pageSize: query.pageSize, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) },
    };
  },

  async getById(id: string) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw ApiError.notFound('Payment not found');
    return booking;
  },
};
