import { prisma } from '../../../config/prisma';

const PROFILE_INCLUDE = {
  user: {
    select: { id: true, name: true, phone: true, email: true, avatarUrl: true },
  },
  skills: true,
  categories: true,
  services: { where: { isActive: true } },
  availability: true,
  portfolio: true,
  verification: true,
} as const;

export const artisanProfileRepository = {
  async findByUserId(userId: string) {
    return prisma.artisanProfile.findUnique({
      where: { userId },
      include: PROFILE_INCLUDE,
    });
  },

  async findByArtisanId(artisanId: string) {
    return prisma.artisanProfile.findUnique({
      where: { id: artisanId },
      include: PROFILE_INCLUDE,
    });
  },
};
