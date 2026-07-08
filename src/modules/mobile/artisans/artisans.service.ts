import { Prisma, ApplicationStatus, VerificationReviewStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { parsePagination } from '../../utils/pagination';
import { buildPaginationMeta } from '../../utils/apiResponse';
import { emitToUser, emitToAdmins } from '../../sockets/io';
import { SOCKET_EVENTS } from '../../sockets/events';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../../utils/cloudinary';
import { skillsService } from '../../skills/skills.service';
import {
  UpsertArtisanProfileInput,
  AddPortfolioItemInput,
  ListArtisansQuery,
  CreateServiceInput,
  UpdateServiceInput,
  UpdateAvailabilityInput,
} from './artisans.validators';

const ARTISAN_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  isSuspended: true,
} as const;

const ARTISAN_INCLUDE = {
  user: { select: ARTISAN_USER_SELECT },
  portfolio: { orderBy: { createdAt: 'desc' as const } },
  skills: true,
  categories: true,
  services: { where: { isActive: true } },
  availability: true,
  verification: true,
} satisfies Prisma.ArtisanProfileInclude;

/**
 * Normalizes a stored ArtisanProfile (relations) into the public API shape the
 * mobile apps expect: `skills` and `categories` are returned as string arrays.
 */
const serializeProfile = (profile: any) => ({
  ...profile,
  skills: (profile.skills ?? []).map((s: any) => s.name),
  categories: (profile.categories ?? []).map((c: any) => c.name),
});

export const artisansService = {
  async getProfileByUserId(userId: string) {
    const profile = await prisma.artisanProfile.findUnique({
      where: { userId },
      include: ARTISAN_INCLUDE,
    });

    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    return serializeProfile(profile);
  },

  async getById(id: string) {
    const profile = await prisma.artisanProfile.findUnique({
      where: { id },
      include: ARTISAN_INCLUDE,
    });

    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return serializeProfile(profile);
  },

  async upsertProfile(userId: string, input: UpsertArtisanProfileInput) {
    const { availability, skills, categories, ...rest } = input;

    const profile = await prisma.artisanProfile.upsert({
      where: { userId },
      create: { userId, ...rest },
      update: { ...rest },
      include: ARTISAN_INCLUDE,
    });

    if (skills) {
      await this.replaceSkills(profile.id, skills);
    }
    if (categories) {
      await this.replaceCategories(profile.id, categories);
    }
    if (availability !== undefined) {
      await this.replaceAvailability(profile.id, availability);
    }

    const refreshed = await this.getById(profile.id);
    return refreshed;
  },

  async replaceSkills(artisanId: string, names: string[]) {
    await skillsService.assertValid(names);
    await prisma.$transaction([
      prisma.artisanSkill.deleteMany({ where: { artisanId } }),
      prisma.artisanSkill.createMany({
        data: names.map((name) => ({ artisanId, name })),
        skipDuplicates: true,
      }),
    ]);
  },

  async replaceCategories(artisanId: string, names: string[]) {
    await prisma.$transaction([
      prisma.artisanCategory.deleteMany({ where: { artisanId } }),
      prisma.artisanCategory.createMany({
        data: names.map((name) => ({ artisanId, name })),
        skipDuplicates: true,
      }),
    ]);
  },

  async replaceAvailability(artisanId: string, slots: UpdateAvailabilityInput['slots']) {
    await prisma.artisanAvailability.deleteMany({ where: { artisanId } });
    if (slots && slots.length > 0) {
      await prisma.artisanAvailability.createMany({
        data: slots.map((s) => ({ artisanId, day: s.day, startTime: s.startTime, endTime: s.endTime })),
      });
    }
  },

  async list(query: ListArtisansQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    // Phase 8: public marketplace only exposes ACTIVE artisans.
    const where: Prisma.ArtisanProfileWhereInput = {
      isSuspended: false,
      status: ApplicationStatus.ACTIVE,
      ...(query.category ? { categories: { some: { name: query.category } } } : {}),
      ...(query.query
        ? {
            OR: [
              { businessName: { contains: query.query, mode: 'insensitive' } },
              { bio: { contains: query.query, mode: 'insensitive' } },
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

    return {
      items: items.map(serializeProfile),
      meta: buildPaginationMeta(page, pageSize, totalItems),
    };
  },

  async listPortfolio(artisanId: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id: artisanId } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return prisma.artisanPortfolio.findMany({
      where: { artisanId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async addPortfolioItem(userId: string, input: AddPortfolioItemInput, file: any) {
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
      console.error('Cloudinary upload failed (portfolio):', error);
      throw ApiError.internal('Failed to upload image.');
    }

    return prisma.artisanPortfolio.create({
      data: { artisanId: profile.id, title: input.title, description: input.description, imageUrl },
    });
  },

  async removePortfolioItem(userId: string, itemId: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const item = await prisma.artisanPortfolio.findUnique({ where: { id: itemId } });
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

    await prisma.artisanPortfolio.delete({ where: { id: itemId } });
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
      console.error('Cloudinary upload failed (profile-image):', error);
      throw ApiError.internal('Failed to upload image.');
    }

    const updated = await prisma.artisanProfile.update({
      where: { userId },
      data: { profileImageUrl: imageUrl },
      include: ARTISAN_INCLUDE,
    });

    return serializeProfile(updated);
  },

  // ── Application status / verification review ───────────────────────────

  async setApplicationStatus(artisanId: string, status: ApplicationStatus, note?: string, changedBy?: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id: artisanId } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    const updated = await prisma.artisanProfile.update({
      where: { id: artisanId },
      data: { status },
      include: ARTISAN_INCLUDE,
    });

    await prisma.applicationStatusHistory.create({
      data: { artisanId, status, note, changedBy },
    });

    return serializeProfile(updated);
  },

  async applyVerificationReview(
    artisanId: string,
    reviewStatus: VerificationReviewStatus,
    note?: string,
    reviewedBy?: string
  ) {
    const verification = await prisma.artisanVerification.findUnique({ where: { artisanId } });
    if (!verification) {
      throw ApiError.notFound('Verification record not found.');
    }

    return prisma.artisanVerification.update({
      where: { artisanId },
      data: {
        reviewStatus,
        reviewNotes: note ?? verification.reviewNotes,
        reviewedBy: reviewedBy ?? verification.reviewedBy,
        reviewedAt: new Date(),
      },
    });
  },

  async approve(artisanId: string, note: string | undefined, changedBy: string | undefined) {
    const updated = await this.setApplicationStatus(artisanId, ApplicationStatus.ACTIVE, note, changedBy);
    await this.applyVerificationReview(artisanId, VerificationReviewStatus.APPROVED, note, changedBy).catch(
      () => undefined
    );

    emitToUser(updated.user.id, SOCKET_EVENTS.ARTISAN_VERIFIED, updated);
    emitToAdmins(SOCKET_EVENTS.ARTISAN_VERIFIED, updated);
    return updated;
  },

  async reject(artisanId: string, note: string, changedBy: string | undefined) {
    const updated = await this.setApplicationStatus(artisanId, ApplicationStatus.REJECTED, note, changedBy);
    await this.applyVerificationReview(artisanId, VerificationReviewStatus.REJECTED, note, changedBy).catch(
      () => undefined
    );
    return updated;
  },

  async requestChanges(artisanId: string, note: string, changedBy: string | undefined) {
    const updated = await this.setApplicationStatus(
      artisanId,
      ApplicationStatus.CHANGES_REQUESTED,
      note,
      changedBy
    );
    await this.applyVerificationReview(artisanId, VerificationReviewStatus.CHANGES_REQUESTED, note, changedBy).catch(
      () => undefined
    );
    return updated;
  },

  async setSuspended(id: string, suspended: boolean) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return serializeProfile(
      await prisma.artisanProfile.update({
        where: { id },
        data: { isSuspended: suspended },
        include: ARTISAN_INCLUDE,
      })
    );
  },

  // ── Bookable services ──────────────────────────────────────────────────

  async listServices(artisanId: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id: artisanId } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return prisma.artisanService.findMany({
      where: { artisanId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  async createService(userId: string, input: CreateServiceInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    return prisma.artisanService.create({
      data: { artisanId: profile.id, ...input },
    });
  },

  async updateService(userId: string, serviceId: string, input: UpdateServiceInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const service = await prisma.artisanService.findUnique({ where: { id: serviceId } });
    if (!service || service.artisanId !== profile.id) {
      throw ApiError.notFound('Service not found.');
    }

    return prisma.artisanService.update({ where: { id: serviceId }, data: input });
  },

  async deleteService(userId: string, serviceId: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const service = await prisma.artisanService.findUnique({ where: { id: serviceId } });
    if (!service || service.artisanId !== profile.id) {
      throw ApiError.notFound('Service not found.');
    }

    await prisma.artisanService.update({ where: { id: serviceId }, data: { isActive: false } });
    return { message: 'Service removed.' };
  },

  // ── Availability ──────────────────────────────────────────────────────

  async getAvailability(id: string) {
    const profile = await prisma.artisanProfile.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return prisma.artisanAvailability.findMany({ where: { artisanId: id } });
  },

  async updateAvailability(userId: string, slots: UpdateAvailabilityInput['slots']) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    await this.replaceAvailability(profile.id, slots ?? []);
    return prisma.artisanAvailability.findMany({ where: { artisanId: profile.id } });
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
