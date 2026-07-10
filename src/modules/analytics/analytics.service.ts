import { BookingStatus, Role, ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BookingTrendsQuery } from './analytics.validators';

interface DailyTrendRow {
  date: string;
  count: bigint | number;
}

interface CategoryCountRow {
  categoryId: string;
  _count: {
    categoryId: number;
  };
}

export const analyticsService = {
  async getOverview() {
    const [
      totalUsers,
      totalStudents,
      totalArtisans,
      totalAdmins,
      pendingVerifications,
      totalBookings,
      bookingsByStatus,
      ratingAggregate,
      revenueAggregate,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.student } }),
      prisma.user.count({ where: { role: Role.artisan } }),
      prisma.user.count({ where: { role: { in: [Role.admin, Role.super_admin] } } }),
      prisma.artisanProfile.count({ where: { applicationStatus: ApplicationStatus.PENDING_REVIEW } }),
      prisma.booking.count(),
      prisma.booking.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: { rating: true } }),
      prisma.booking.aggregate({
        where: { status: BookingStatus.completed },
        _sum: { price: true },
      }),
    ]);

    const statusCounts = bookingsByStatus.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count.status;
      return acc;
    }, {});

    return {
      totalUsers,
      totalStudents,
      totalArtisans,
      totalAdmins,
      pendingVerifications,
      totalBookings,
      bookingsByStatus: statusCounts,
      averageRating: Number(ratingAggregate._avg.rating ?? 0),
      totalReviews: ratingAggregate._count.rating,
      // "Revenue" is future-ready: sums completed booking prices. No
      // payment processor is integrated yet, so this represents gross
      // service value rather than platform take.
      totalRevenue: Number(revenueAggregate._sum.price ?? 0),
    };
  },

  /** Daily booking counts for the trailing N days. */
  async getBookingTrends(query: BookingTrendsQuery) {
    const since = new Date();
    since.setDate(since.getDate() - query.days);

    const rows = await prisma.$queryRaw<DailyTrendRow[]>`
      SELECT
        to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date,
        COUNT(*) AS count
      FROM "bookings"
      WHERE "createdAt" >= ${since}
      GROUP BY date_trunc('day', "createdAt")
      ORDER BY date_trunc('day', "createdAt") ASC
    `;

    return rows.map((row) => ({ date: row.date, count: Number(row.count) }));
  },

  /** Top categories by number of bookable services listed. */
  async getTopCategories(limit = 10) {
    const rows = await prisma.artisanService.groupBy({
      by: ['categoryId'],
      where: { isActive: true },
      _count: { categoryId: true },
      orderBy: { _count: { categoryId: 'desc' } },
      take: limit,
    });

    const categoryIds = rows.map((row) => row.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return rows.map((row) => ({ category: categoryMap.get(row.categoryId) ?? row.categoryId, count: row._count.categoryId }));
  },

  async getAverageRatings() {
    const overall = await prisma.review.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
    });

    const topRated = await prisma.artisanProfile.findMany({
      where: { reviewCount: { gt: 0 } },
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
      take: 5,
      select: {
        id: true,
        businessName: true,
        rating: true,
        reviewCount: true,
        user: { select: { name: true } },
      },
    });

    return {
      overallAverage: Number(overall._avg.rating ?? 0),
      totalReviews: overall._count.rating,
      topRated: topRated.map((artisan) => ({
        artisanId: artisan.id,
        name: artisan.businessName ?? artisan.user.name,
        rating: Number(artisan.rating),
        reviewCount: artisan.reviewCount,
      })),
    };
  },
};
