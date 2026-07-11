import { BookingStatus, ReportStatus, Role, ApplicationStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { analyticsService } from '../../analytics/analytics.service';

export const dashboardService = {
  async getStats() {
    const [
      totalUsers,
      totalStudents,
      totalArtisans,
      totalAdmins,
      totalBookings,
      pendingVerifications,
      totalReviews,
      totalReports,
      totalCategories,
      revenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.student } }),
      prisma.user.count({ where: { role: Role.artisan } }),
      prisma.user.count({ where: { role: { in: [Role.admin, Role.super_admin] } } }),
      prisma.booking.count(),
      prisma.artisanProfile.count({ where: { applicationStatus: ApplicationStatus.PENDING_REVIEW } }),
      prisma.review.count(),
      prisma.report.count(),
      prisma.category.count(),
      prisma.booking.aggregate({ where: { status: BookingStatus.completed }, _sum: { price: true } }),
    ]);

    return {
      totalUsers,
      totalStudents,
      totalArtisans,
      totalAdmins,
      totalBookings,
      pendingVerifications,
      totalReviews,
      totalReports,
      totalCategories,
      revenue: Number(revenue._sum.price ?? 0),
    };
  },

  async overview() {
    const [stats, bookingsByStatus, reportsByStatus] = await Promise.all([
      this.getStats(),
      prisma.booking.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.report.groupBy({ by: ['status'], _count: { status: true } }),
    ]);

    const bookingCounts = bookingsByStatus.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count.status;
      return acc;
    }, {});
    const reportCounts = reportsByStatus.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count.status;
      return acc;
    }, {});

    return {
      ...stats,
      activeBookings: bookingCounts[BookingStatus.accepted] ?? 0,
      completedBookings: bookingCounts[BookingStatus.completed] ?? 0,
      cancelledBookings: bookingCounts[BookingStatus.cancelled] ?? 0,
      bookingsByStatus: bookingCounts,
      reportsByStatus: reportCounts,
    };
  },

  async statistics() {
    const overview = await this.overview();
    const [topCategories, ratings] = await Promise.all([
      analyticsService.getTopCategories(5),
      analyticsService.getAverageRatings(),
    ]);
    return { ...overview, topCategories, ratings };
  },

  async recentActivities(limit = 15) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async recentBookings(limit = 10) {
    return prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        student: { select: { id: true, name: true } },
        artisan: { include: { user: { select: { id: true, name: true } } } },
      },
    });
  },

  async recentReviews(limit = 10) {
    return prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        student: { select: { id: true, name: true, profileImageUrl: true } },
        artisan: { include: { user: { select: { id: true, name: true } } } },
      },
    });
  },

  async recentReports(limit = 10) {
    return prisma.report.findMany({
      where: { status: ReportStatus.open },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        reporter: { select: { id: true, name: true, role: true } },
        target: { select: { id: true, name: true, role: true } },
      },
    });
  },
};
