import { BookingStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { parsePagination } from '../../utils/pagination';
import { buildPaginationMeta } from '../../utils/apiResponse';
import { emitToUser } from '../../sockets/io';
import { SOCKET_EVENTS } from '../../sockets/events';
import {
  CreateBookingInput,
  ListBookingsQuery,
} from './bookings.validators';

const BOOKING_INCLUDE = {
  artisan: {
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
  student: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.BookingInclude;

/** Valid status transitions, keyed by current status. */
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  rejected: [],
};

const assertParticipant = (
  booking: { studentId: string; artisan: { userId: string } },
  userId: string,
  role: Role
) => {
  const isStudentOwner = role === Role.student && booking.studentId === userId;
  const isArtisanOwner = role === Role.artisan && booking.artisan.userId === userId;
  const isAdmin = role === Role.admin || role === Role.super_admin;

  if (!isStudentOwner && !isArtisanOwner && !isAdmin) {
    throw ApiError.forbidden('You do not have access to this booking.');
  }
};

export const bookingsService = {
  async create(studentId: string, input: CreateBookingInput) {
    const artisan = await prisma.artisanProfile.findUnique({ where: { id: input.artisanId } });
    if (!artisan) {
      throw ApiError.notFound('Artisan not found.');
    }

    if (artisan.isSuspended) {
      throw ApiError.badRequest('This artisan is currently unavailable for bookings.');
    }

    if (artisan.applicationStatus !== 'ACTIVE') {
      throw ApiError.badRequest('This artisan is not yet active and cannot accept bookings.');
    }

    let serviceTitle = input.serviceTitle;
    let price = input.price;

    if (input.serviceId) {
      const svc = await prisma.artisanService.findUnique({ where: { id: input.serviceId } });
      if (!svc || svc.artisanProfileId !== artisan.id || !svc.isActive) {
        throw ApiError.notFound('Service not found for this artisan.');
      }
      serviceTitle = svc.title;
      price = Number(svc.price);
    }

    if (!serviceTitle || price === undefined) {
      throw ApiError.badRequest('Unable to determine service title and price.');
    }

    const booking = await prisma.booking.create({
      data: {
        studentId,
        artisanId: artisan.id,
        serviceTitle,
        price,
        scheduledTime: input.scheduledTime,
        notes: input.notes,
        status: BookingStatus.pending,
      },
      include: BOOKING_INCLUDE,
    });

    // Notify the artisan in real time.
    emitToUser(artisan.userId, SOCKET_EVENTS.BOOKING_CREATED, booking);

    return booking;
  },

  async getById(id: string, userId: string, role: Role) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: BOOKING_INCLUDE,
    });

    if (!booking) {
      throw ApiError.notFound('Booking not found.');
    }

    assertParticipant(booking, userId, role);
    return booking;
  },

  async list(userId: string, role: Role, query: ListBookingsQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    let where: Prisma.BookingWhereInput = {};

    if (role === Role.student) {
      where = { studentId: userId, ...(query.status ? { status: query.status } : {}) };
    } else if (role === Role.artisan) {
      const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
      if (!profile) {
        throw ApiError.notFound('Artisan profile not found.');
      }
      where = { artisanId: profile.id, ...(query.status ? { status: query.status } : {}) };
    } else {
      // Admins can see all bookings, optionally filtered by status.
      where = query.status ? { status: query.status } : {};
    }

    const [items, totalItems] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: BOOKING_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.booking.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  async updateStatus(id: string, userId: string, role: Role, nextStatus: BookingStatus) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: BOOKING_INCLUDE,
    });

    if (!booking) {
      throw ApiError.notFound('Booking not found.');
    }

    assertParticipant(booking, userId, role);

    const isAdmin = role === Role.admin || role === Role.super_admin;
    const isArtisanOwner = role === Role.artisan && booking.artisan.userId === userId;
    const isStudentOwner = role === Role.student && booking.studentId === userId;

    // Role-based transition rules:
    // - Artisans: accept / reject / start (in_progress) / complete
    // - Students: cancel only (while pending or accepted)
    // - Admins: any valid transition
    if (!isAdmin) {
      if (isStudentOwner && nextStatus !== BookingStatus.cancelled) {
        throw ApiError.forbidden('Students can only cancel a booking.');
      }
      if (isArtisanOwner && nextStatus === BookingStatus.cancelled && booking.status !== BookingStatus.pending) {
        throw ApiError.forbidden('Artisans can only cancel a pending booking.');
      }
    }

    if (!ALLOWED_TRANSITIONS[booking.status].includes(nextStatus)) {
      throw ApiError.badRequest(
        `Cannot transition booking from "${booking.status}" to "${nextStatus}".`
      );
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: nextStatus },
      include: BOOKING_INCLUDE,
    });

    // Real-time notifications
    const studentRoomId = updated.studentId;
    const artisanUserId = updated.artisan.userId;

    switch (nextStatus) {
      case BookingStatus.accepted:
        emitToUser(studentRoomId, SOCKET_EVENTS.BOOKING_ACCEPTED, updated);
        break;
      case BookingStatus.completed:
        emitToUser(studentRoomId, SOCKET_EVENTS.BOOKING_COMPLETED, updated);
        break;
      case BookingStatus.cancelled:
      case BookingStatus.rejected:
        emitToUser(studentRoomId, SOCKET_EVENTS.BOOKING_CANCELLED, updated);
        emitToUser(artisanUserId, SOCKET_EVENTS.BOOKING_CANCELLED, updated);
        break;
      default:
        break;
    }

    return updated;
  },
};
