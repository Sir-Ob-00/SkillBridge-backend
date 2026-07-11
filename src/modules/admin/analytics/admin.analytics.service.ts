import { BookingStatus, Role, ApplicationStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { analyticsService } from '../../analytics/analytics.service';

export interface AnalyticsQuery {
  from?: string;
  to?: string;
  days: number;
}

function dateRange(query: AnalyticsQuery): { from?: Date; to?: Date } {
  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(query.to) : undefined;
  return { from, to };
}

export const adminAnalyticsService = {
  async getAnalytics(query: AnalyticsQuery) {
    const { from, to } = dateRange(query);
    const [overview, usersTrend, bookingsTrend, reviewsTrend] = await Promise.all([
      this.overview(query),
      this.users(query),
      this.bookings(query),
      this.reviews(query),
    ]);
    return { ...overview, usersTrend, bookingsTrend, reviewsTrend };
  },

  async overview(_query: AnalyticsQuery) {
    const [overview, topCategories, ratings] = await Promise.all([
      analyticsService.getOverview(),
      analyticsService.getTopCategories(5),
      analyticsService.getAverageRatings(),
    ]);
    return { ...overview, topCategories, ratings };
  },

  async users(_query: AnalyticsQuery) {
    const total = await prisma.user.count();
    const students = await prisma.user.count({ where: { role: Role.student } });
    const artisans = await prisma.user.count({ where: { role: Role.artisan } });
    const admins = await prisma.user.count({ where: { role: { in: [Role.admin, Role.super_admin] } } });
    return { total, students, artisans, admins };
  },

  async bookings(query: AnalyticsQuery) {
    const { from, to } = dateRange(query);
    const where: Record<string, unknown> = {};
    if (from) where.createdAt = { ...(where.createdAt as Record<string, unknown>), gte: from };
    if (to) where.createdAt = { ...(where.createdAt as Record<string, unknown>), lte: to };

    const [total, byStatus, revenue] = await Promise.all([
      prisma.booking.count({ where: where as any }),
      prisma.booking.groupBy({ by: ['status'], where: where as any, _count: { status: true } }),
      prisma.booking.aggregate({
        where: { ...(where as any), status: BookingStatus.completed },
        _sum: { price: true },
      }),
    ]);

    const counts = byStatus.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count.status;
      return acc;
    }, {});

    return { total, byStatus: counts, revenue: Number(revenue._sum.price ?? 0) };
  },

  async reviews(query: AnalyticsQuery) {
    const { from, to } = dateRange(query);
    const where: Record<string, unknown> = {};
    if (from) where.createdAt = { ...(where.createdAt as Record<string, unknown>), gte: from };
    if (to) where.createdAt = { ...(where.createdAt as Record<string, unknown>), lte: to };

    const [total, flagged, avg] = await Promise.all([
      prisma.review.count({ where: where as any }),
      prisma.review.count({ where: { ...(where as any), isFlagged: true } }),
      prisma.review.aggregate({ where: where as any, _avg: { rating: true } }),
    ]);

    return { total, flagged, averageRating: Number(avg._avg.rating ?? 0) };
  },

  async reports(_query: AnalyticsQuery) {
    const [total, open, resolved] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'open' } }),
      prisma.report.count({ where: { status: 'resolved' } }),
    ]);
    return { total, open, resolved };
  },

  async categories(_query: AnalyticsQuery) {
    const rows = await prisma.artisanService.groupBy({
      by: ['categoryId'],
      where: { isActive: true },
      _count: { categoryId: true },
      orderBy: { _count: { categoryId: 'desc' } },
      take: 10,
    });

    const categoryIds = rows.map((r) => r.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return rows.map((r) => ({ category: map.get(r.categoryId) ?? r.categoryId, count: r._count.categoryId }));
  },

  async revenue(query: AnalyticsQuery) {
    const { from, to } = dateRange(query);
    const where: Record<string, unknown> = { status: BookingStatus.completed };
    if (from) where.createdAt = { ...(where.createdAt as Record<string, unknown>), gte: from };
    if (to) where.createdAt = { ...(where.createdAt as Record<string, unknown>), lte: to };

    const [total, byDay] = await Promise.all([
      prisma.booking.aggregate({ where: where as any, _sum: { price: true } }),
      prisma.$queryRaw<
        { date: string; revenue: string | null }[]
      >`
        SELECT
          to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date,
          SUM("price") AS revenue
        FROM "bookings"
        WHERE "status" = ${BookingStatus.completed}
          AND "createdAt" >= COALESCE(${from ?? new Date(0)}, '1970-01-01')
          AND "createdAt" <= COALESCE(${to ?? new Date()}, NOW())
        GROUP BY date_trunc('day', "createdAt")
        ORDER BY date_trunc('day', "createdAt") ASC
      `,
    ]);

    return {
      total: Number(total._sum.price ?? 0),
      daily: byDay.map((r) => ({ date: r.date, revenue: Number(r.revenue ?? 0) })),
    };
  },
};
