import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';

export const bookingsService = {
  async list(query: { page: number; pageSize: number; status?: string }) {
    const skip = (query.page - 1) * query.pageSize;
    const where: any = {};
    if (query.status) where.status = query.status;

    const [items, totalItems] = await Promise.all([
      prisma.booking.findMany({ where, skip, take: query.pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.booking.count({ where }),
    ]);

    return {
      items,
      meta: { page: query.page, pageSize: query.pageSize, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) },
    };
  },

  async getById(id: string) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw ApiError.notFound('Booking not found');
    return booking;
  },

  async updateStatus(id: string, status: string) {
    return prisma.booking.update({ where: { id }, data: { status: status as any } });
  },
};
