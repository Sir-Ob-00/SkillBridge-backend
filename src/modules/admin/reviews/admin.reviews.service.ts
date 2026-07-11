import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { reviewsService } from '../../reviews/reviews.service';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';

const REVIEW_INCLUDE = {
  student: { select: { id: true, name: true, profileImageUrl: true } },
  artisan: { include: { user: { select: { id: true, name: true } } } },
};

export const adminReviewsService = {
  async list(query: { page?: number; pageSize?: number; flagged?: boolean } = {}) {
    const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);
    const where = query.flagged ? { isFlagged: true } : {};
    const [items, totalItems] = await Promise.all([
      prisma.review.findMany({ where, include: REVIEW_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.review.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  async statistics() {
    const [total, flagged, avg] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { isFlagged: true } }),
      prisma.review.aggregate({ _avg: { rating: true } }),
    ]);
    return { total, flagged, averageRating: Number(avg._avg.rating ?? 0) };
  },

  async export() {
    return prisma.review.findMany({ orderBy: { createdAt: 'desc' }, include: REVIEW_INCLUDE });
  },

  async getById(id: string) {
    const review = await prisma.review.findUnique({ where: { id }, include: REVIEW_INCLUDE });
    if (!review) {
      throw ApiError.notFound('Review not found.');
    }
    return review;
  },

  async hide(id: string) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw ApiError.notFound('Review not found.');
    return prisma.review.update({ where: { id }, data: { isFlagged: true }, include: REVIEW_INCLUDE });
  },

  async restore(id: string) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw ApiError.notFound('Review not found.');
    return prisma.review.update({ where: { id }, data: { isFlagged: false }, include: REVIEW_INCLUDE });
  },

  async flag(id: string) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw ApiError.notFound('Review not found.');
    return prisma.review.update({ where: { id }, data: { isFlagged: true }, include: REVIEW_INCLUDE });
  },

  remove(id: string) {
    return reviewsService.delete(id);
  },
};
