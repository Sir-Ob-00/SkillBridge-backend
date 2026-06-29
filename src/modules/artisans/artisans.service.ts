import { Prisma, VerificationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { parsePagination } from '../../utils/pagination';
import { buildPaginationMeta } from '../../utils/apiResponse';
import { emitToUser, emitToAdmins } from '../../sockets/io';
import { SOCKET_EVENTS } from '../../sockets/events';
import {
  UpsertArtisanProfileInput,
  AddPortfolioItemInput,
  ListArtisansQuery,
  CreateServiceInput,
  UpdateServiceInput,
} from './artisans.validators';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../../utils/cloudinary';

const ARTISAN_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      isSuspended: true,
    },
  },
  portfolio: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.ArtisanProfileInclude;

export const artisansService = {
  async getProfileByUserId(userId: string) {
    const profile = await prisma.artisanProfile.findUnique({
      where: { userId },
      include: ARTISAN_INCLUDE,
    });

    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    return profile;
  },

  async getById(id: string) {
    const profile = await prisma.artisanProfile.findUnique({
      where: { id },
      include: ARTISAN_INCLUDE,
    });

    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return profile;
  },

  async upsertProfile(userId: string, input: UpsertArtisanProfileInput) {
    const { availability, ...rest } = input;

    const profile = await prisma.artisanProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...rest,
        ...(availability !== undefined
          ? { availability: availability as unknown as Prisma.InputJsonValue }
          : {}),
      },
      update: {
        ...rest,
        ...(availability !== undefined
          ? { availability: availability as unknown as Prisma.InputJsonValue }
          : {}),
      },
      include: ARTISAN_INCLUDE,
    });

    return profile;
  },

  async list(query: ListArtisansQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where: Prisma.ArtisanProfileWhereInput = {
      isSuspended: false,
      ...(query.verification ? { verification: query.verification } : {}),
      ...(query.category ? { categories: { has: query.category } } : {}),
      ...(query.query
        ? {
            OR: [
              { businessName: { contains: query.query, mode: 'insensitive' } },
              { bio: { contains: query.query, mode: 'insensitive' } },
              { skills: { has: query.query } },
              { user: { name: { contains: query.query, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      prisma.artisanProfile.findMany({
        where,
        include: ARTISAN_INCLUDE,
        orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.artisanProfile.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  async listPortfolio(artisanId: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id: artisanId } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return prisma.portfolioItem.findMany({
      where: { artisanId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async addPortfolioItem(userId: string, input: { title: string; description?: string }, file: any) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    if (!file) {
      throw ApiError.badRequest('Image file is required.');
    }

    let imageUrl: string;
    try {
      imageUrl = await uploadToCloudinary(file.buffer, 'portfolio');
    } catch (error) {
      throw ApiError.internal('Failed to upload image.');
    }

    const item = await prisma.portfolioItem.create({
      data: {
        artisanId: profile.id,
        title: input.title,
        description: input.description,
        imageUrl,
      },
    });

    return item;
  },

  async removePortfolioItem(userId: string, itemId: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const item = await prisma.portfolioItem.findUnique({ where: { id: itemId } });
    if (!item || item.artisanId !== profile.id) {
      throw ApiError.notFound('Portfolio item not found.');
    }

    try {
      const publicId = getPublicIdFromUrl(item.imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    } catch {
      // proceed with deletion even if cloudinary delete fails
    }

    await prisma.portfolioItem.delete({ where: { id: itemId } });
    return { message: 'Portfolio item removed.' };
  },

  async updateProfileImage(userId: string, file: any) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    if (!file) {
      throw ApiError.badRequest('Image file is required.');
    }

    try {
      const oldPublicId = getPublicIdFromUrl(profile.profileImageUrl ?? '');
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId).catch(() => {});
      }
    } catch {
      // ignore old image cleanup errors
    }

    let imageUrl: string;
    try {
      imageUrl = await uploadToCloudinary(file.buffer, 'artisans/profile');
    } catch (error) {
      throw ApiError.internal('Failed to upload image.');
    }

    const updated = await prisma.artisanProfile.update({
      where: { userId },
      data: { profileImageUrl: imageUrl },
      include: ARTISAN_INCLUDE,
    });

    return updated;
  },

  // ── Admin moderation ────────────────────────────────────────────────

  async setVerification(id: string, status: VerificationStatus) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    const updated = await prisma.artisanProfile.update({
      where: { id },
      data: { verification: status },
      include: ARTISAN_INCLUDE,
    });

    if (status === VerificationStatus.verified) {
      emitToUser(profile.userId, SOCKET_EVENTS.ARTISAN_VERIFIED, updated);
    }
    emitToAdmins(SOCKET_EVENTS.ARTISAN_VERIFIED, updated);

    return updated;
  },

  async setSuspended(id: string, suspended: boolean) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return prisma.artisanProfile.update({
      where: { id },
      data: { isSuspended: suspended },
      include: ARTISAN_INCLUDE,
    });
  },

  // ── Bookable services ───────────────────────────────────────────────

  async listServices(artisanId: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id: artisanId } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return prisma.service.findMany({
      where: { artisanId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  async createService(userId: string, input: CreateServiceInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    return prisma.service.create({
      data: { artisanId: profile.id, ...input },
    });
  },

  async updateService(userId: string, serviceId: string, input: UpdateServiceInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.artisanId !== profile.id) {
      throw ApiError.notFound('Service not found.');
    }

    return prisma.service.update({ where: { id: serviceId }, data: input });
  },

  async deleteService(userId: string, serviceId: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.artisanId !== profile.id) {
      throw ApiError.notFound('Service not found.');
    }

    await prisma.service.update({ where: { id: serviceId }, data: { isActive: false } });
    return { message: 'Service removed.' };
  },

  // ── Availability ─────────────────────────────────────────────────────

  async getAvailability(id: string) {
    const profile = await prisma.artisanProfile.findUnique({
      where: { id },
      select: { availability: true },
    });

    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return profile.availability ?? [];
  },

  async updateAvailability(userId: string, slots: UpsertArtisanProfileInput['availability']) {
    const profile = await prisma.artisanProfile.update({
      where: { userId },
      data: {
        availability: (slots ?? []) as unknown as Prisma.InputJsonValue,
      },
      select: { availability: true },
    });

    return profile.availability ?? [];
  },


  async recomputeRating(artisanId: string) {
    const aggregate = await prisma.review.aggregate({
      where: { artisanId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.artisanProfile.update({
      where: { id: artisanId },
      data: {
        rating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.rating,
      },
    });
  },
};
