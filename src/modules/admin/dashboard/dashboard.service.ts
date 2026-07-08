import { prisma } from '../../../config/prisma';
import { analyticsService } from '../../analytics/analytics.service';

const RECENT_LIMIT = 5;

export const dashboardService = {
  async getDashboard() {
    const [
      overview,
      recentBookings,
      recentReports,
      pendingVerifications,
    ] = await Promise.all([
      analyticsService.getOverview(),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        include: {
          student: { select: { id: true, name: true } },
          artisan: { include: { user: { select: { id: true, name: true } } } },
        },
      }),
      prisma.report.findMany({
        where: { status: 'open' },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        include: {
          reporter: { select: { id: true, name: true } },
          target: { select: { id: true, name: true } },
        },
      }),
      prisma.artisanProfile.findMany({
        where: { status: 'PENDING_REVIEW' },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    return {
      ...overview,
      recentBookings,
      recentReports,
      pendingVerifications,
    };
  },
};
