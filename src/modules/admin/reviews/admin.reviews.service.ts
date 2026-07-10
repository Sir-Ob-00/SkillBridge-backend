import { prisma } from '../../../config/prisma';
import { reviewsService } from '../../reviews/reviews.service';

export const adminReviewsService = {
  async list() {
    return prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, profileImageUrl: true } },
        artisan: { include: { user: { select: { id: true, name: true } } } },
      },
    });
  },

  remove(id: string) {
    return reviewsService.delete(id);
  },
};
