import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';

export const profileService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('Admin profile not found');
    const { password, ...safe } = user as any;
    return safe;
  },

  async updateProfile(userId: string, data: Record<string, any>) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, phone: true, profileImageUrl: true, role: true, createdAt: true },
    });
  },
};
