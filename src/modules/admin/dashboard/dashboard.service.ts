import { prisma } from '../../../config/prisma';

export const dashboardService = {
  async getStats() {
    const [
      totalUsers,
      totalStudents,
      totalArtisans,
      totalAdmins,
      totalBookings,
      pendingVerifications,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.user.count({ where: { role: 'artisan' } }),
      prisma.user.count({ where: { role: { in: ['admin', 'super_admin'] } } }),
      prisma.booking.count(),
      prisma.artisanProfile.count({ where: { applicationStatus: 'PENDING_REVIEW' } }),
      prisma.booking.aggregate({
        where: { status: 'completed' },
        _sum: { price: true },
      }),
    ]);

    return {
      totalUsers,
      totalStudents,
      totalArtisans,
      totalAdmins,
      totalBookings,
      pendingVerifications,
      totalRevenue: Number(totalRevenue._sum.price ?? 0),
    };
  },
};
