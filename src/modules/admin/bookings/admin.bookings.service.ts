import { Role, BookingStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { bookingsService } from '../../bookings/bookings.service';
import { ListBookingsQuery } from '../../bookings/bookings.validators';
import { ApiError } from '../../../utils/ApiError';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';
import { notifyUser } from '../../../utils/notify';

// Admins may access any booking; the bookingsService treats admin role as a
// privileged participant, so a sentinel id is sufficient for the lookup.
const ADMIN_SENTINEL = '00000000-0000-0000-0000-000000000000';

const BOOKING_INCLUDE = {
  artisan: { include: { user: { select: { id: true, name: true, profileImageUrl: true } } } },
  student: { select: { id: true, name: true, profileImageUrl: true } },
};

export const adminBookingsService = {
  list(query: ListBookingsQuery) {
    return bookingsService.list(ADMIN_SENTINEL, Role.admin, query);
  },

  async statistics() {
    const [total, byStatus, revenue] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.booking.aggregate({ where: { status: BookingStatus.completed }, _sum: { price: true } }),
    ]);
    const counts = byStatus.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count.status;
      return acc;
    }, {});
    return { total, byStatus: counts, revenue: Number(revenue._sum.price ?? 0) };
  },

  async export() {
    return prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      include: BOOKING_INCLUDE,
    });
  },

  getById(id: string) {
    return bookingsService.getById(id, ADMIN_SENTINEL, Role.admin);
  },

  async getTimeline(id: string) {
    const booking = await prisma.booking.findUnique({ where: { id }, include: BOOKING_INCLUDE });
    if (!booking) {
      throw ApiError.notFound('Booking not found.');
    }
    const timeline = [
      { event: 'created', at: booking.createdAt },
      { event: 'updated', at: booking.updatedAt },
      { event: booking.status, at: booking.updatedAt },
    ];
    return { booking, timeline };
  },

  updateStatus(id: string, status: BookingStatus) {
    return bookingsService.updateStatus(id, ADMIN_SENTINEL, Role.admin, status);
  },

  async cancel(id: string) {
    const booking = await bookingsService.updateStatus(id, ADMIN_SENTINEL, Role.admin, BookingStatus.cancelled);
    await notifyUser(booking.studentId, 'Booking cancelled', `Your booking (${booking.serviceTitle}) was cancelled by an administrator.`);
    await notifyUser(booking.artisan.userId, 'Booking cancelled', `Booking (${booking.serviceTitle}) was cancelled by an administrator.`);
    return booking;
  },

  async complete(id: string) {
    const booking = await bookingsService.updateStatus(id, ADMIN_SENTINEL, Role.admin, BookingStatus.completed);
    await notifyUser(booking.studentId, 'Booking completed', `Your booking (${booking.serviceTitle}) has been marked completed.`);
    return booking;
  },

  async dispute(id: string) {
    const booking = await bookingsService.updateStatus(id, ADMIN_SENTINEL, Role.admin, BookingStatus.cancelled);
    await notifyUser(booking.studentId, 'Booking disputed', `Your booking (${booking.serviceTitle}) is under dispute and has been paused.`);
    await notifyUser(booking.artisan.userId, 'Booking disputed', `Booking (${booking.serviceTitle}) is under dispute.`);
    return booking;
  },
};
