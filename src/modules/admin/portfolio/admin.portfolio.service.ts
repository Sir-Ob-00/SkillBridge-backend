import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { getPublicIdFromUrl, deleteFromCloudinary } from '../../../utils/cloudinary';

export const adminPortfolioService = {
  async list() {
    return prisma.artisanPortfolio.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        artisanProfile: { include: { user: { select: { id: true, name: true } } } },
      },
    });
  },

  async remove(id: string) {
    const item = await prisma.artisanPortfolio.findUnique({ where: { id } });
    if (!item) {
      throw ApiError.notFound('Portfolio item not found.');
    }

    try {
      const publicId = getPublicIdFromUrl(item.imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(() => {});
      }
    } catch {
      // proceed with deletion even if cloudinary cleanup fails
    }

    await prisma.artisanPortfolio.delete({ where: { id } });
    return { message: 'Portfolio item deleted.' };
  },
};
