import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';
import { ListPaymentsQuery } from './admin.payments.validators';

const PAYMENT_INCLUDE = {
  student: { select: { id: true, name: true, email: true } },
  artisan: { include: { user: { select: { id: true, name: true } } } },
} satisfies Prisma.BookingInclude;

/**
 * The schema has no dedicated Payment model yet — payments are derived from
 * bookings (each booking carries its agreed `price`). This service exposes
 * bookings as payment records until a payment provider is integrated.
 */
export const adminPaymentsService = {
  async list(query: ListPaymentsQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where: Prisma.BookingWhereInput = query.status ? { status: query.status } : {};

    const [items, totalItems] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: PAYMENT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.booking.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  async getById(id: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: PAYMENT_INCLUDE,
    });

    if (!booking) {
      throw ApiError.notFound('Payment not found.');
    }

    return booking;
  },
};
