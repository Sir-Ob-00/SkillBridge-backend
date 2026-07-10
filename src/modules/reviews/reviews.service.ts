import { BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { parsePagination } from '../../utils/pagination';
import { buildPaginationMeta } from '../../utils/apiResponse';
import { artisansService } from '../mobile/artisans/artisans.service';
import { emitToAdmins } from '../../sockets/io';
import { SOCKET_EVENTS } from '../../sockets/events';
import { CreateReviewInput, ListReviewsQuery } from './reviews.validators';

export const reviewsService = {
  async create(studentId: string, input: CreateReviewInput) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { review: true },
    });

    if (!booking) {
      throw ApiError.notFound('Booking not found.');
    }

    if (booking.studentId !== studentId) {
      throw ApiError.forbidden('You can only review your own bookings.');
    }

    if (booking.status !== BookingStatus.completed) {
      throw ApiError.badRequest('You can only review completed bookings.');
    }

    if (booking.review) {
      throw ApiError.conflict('This booking has already been reviewed.');
    }

    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        studentId,
        artisanId: booking.artisanId,
        rating: input.rating,
        comment: input.comment,
      },
    });

    await artisansService.recomputeRating(booking.artisanId);

    return review;
  },

  async listForArtisan(artisanId: string, query: ListReviewsQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = { artisanId, isFlagged: false };

    const [items, totalItems] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, profileImageUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.review.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  async delete(id: string) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw ApiError.notFound('Review not found.');
    }

    await prisma.review.delete({ where: { id } });
    await artisansService.recomputeRating(review.artisanId);

    return { message: 'Review deleted.' };
  },

  async flag(id: string) {
    const review = await prisma.review.update({
      where: { id },
      data: { isFlagged: true },
    });

    emitToAdmins(SOCKET_EVENTS.REVIEW_FLAGGED, review);

    return review;
  },
};
