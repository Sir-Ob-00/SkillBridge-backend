import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';

const ARTISAN_INCLUDE = {
  user: {
    select: { id: true, name: true, profileImageUrl: true },
  },
} as const;

export const studentsService = {
  async getProfile(userId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        savedArtisans: {
          include: { artisan: { include: ARTISAN_INCLUDE } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw ApiError.notFound('Student profile not found.');
    }

    return profile;
  },

  async listSavedArtisans(userId: string) {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Student profile not found.');
    }

    const saved = await prisma.savedArtisan.findMany({
      where: { studentId: profile.id },
      include: { artisan: { include: ARTISAN_INCLUDE } },
      orderBy: { createdAt: 'desc' },
    });

    return saved.map((entry) => entry.artisan);
  },

  async saveArtisan(userId: string, artisanId: string) {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Student profile not found.');
    }

    const artisan = await prisma.artisanProfile.findUnique({ where: { id: artisanId } });
    if (!artisan) {
      throw ApiError.notFound('Artisan not found.');
    }

    await prisma.savedArtisan.upsert({
      where: { studentId_artisanId: { studentId: profile.id, artisanId } },
      create: { studentId: profile.id, artisanId },
      update: {},
    });

    return { message: 'Artisan saved.' };
  },

  async unsaveArtisan(userId: string, artisanId: string) {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Student profile not found.');
    }

    await prisma.savedArtisan.deleteMany({
      where: { studentId: profile.id, artisanId },
    });

    return { message: 'Artisan removed from favorites.' };
  },

  async getBookingHistory(userId: string) {
    return prisma.booking.findMany({
      where: { studentId: userId },
      include: {
        artisan: { include: ARTISAN_INCLUDE },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
