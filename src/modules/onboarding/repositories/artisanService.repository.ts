import { prisma } from '../../../config/prisma';

export const artisanServiceRepository = {
  /** Replaces all active services for an artisan (used by onboarding). */
  async replaceAll(artisanId: string, services: { title: string; description: string; price: number; durationMinutes: number; category: string }[]) {
    await prisma.$transaction([
      prisma.artisanService.deleteMany({ where: { artisanId } }),
      prisma.artisanService.createMany({
        data: services.map((s) => ({ artisanId, ...s })),
      }),
    ]);
    return prisma.artisanService.findMany({ where: { artisanId }, orderBy: { createdAt: 'asc' } });
  },
};
