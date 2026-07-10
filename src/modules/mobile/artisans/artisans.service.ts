import { Prisma, ApplicationStatus, DayOfWeek } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';
import { emitToUser, emitToAdmins } from '../../../sockets/io';
import { SOCKET_EVENTS } from '../../../sockets/events';
import {
  UpsertArtisanProfileInput,
  AddPortfolioItemInput,
  ListArtisansQuery,
  CreateServiceInput,
  UpdateServiceInput,
  ApproveArtisanInput,
  RejectArtisanInput,
  RequestChangesInput,
} from './artisans.validators';

const ARTISAN_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      profileImageUrl: true,
      isSuspended: true,
    },
  },
  portfolio: { orderBy: { createdAt: 'desc' as const } },
  skills: { include: { skill: { select: { id: true, name: true, active: true } } } },
  categories: { include: { category: { select: { name: true, active: true } } } },
  availability: true,
  services: { include: { category: { select: { id: true, name: true, active: true } } } },
  verificationDoc: true,
  statusHistory: { orderBy: { createdAt: 'desc' as const }, take: 1 },
} satisfies Prisma.ArtisanProfileInclude;

const toLegacyProfile = (profile: any) => {
  if (!profile) return null;
  return {
    ...profile,
    skills: (profile.skills ?? []).map((s: any) => s.skill?.name).filter(Boolean),
    categories: (profile.categories ?? []).map((c: any) => c.category?.name).filter(Boolean),
    availability: (profile.availability ?? []).map((a: any) => ({
      day: (a.day ?? 'monday').toLowerCase(),
      startTime: a.startTime,
      endTime: a.endTime,
    })),
    services: (profile.services ?? []).map((s: any) => ({
      ...s,
      categoryName: s.category?.name,
    })),
    portfolio: (profile.portfolio ?? []).map((p: any) => ({
      ...p,
      imageUrl: p.imageUrl,
    })),
    verification: profile.verification ?? 'unverified',
  };
};

export const artisansService = {
  async getProfileByUserId(userId: string) {
    const profile = await prisma.artisanProfile.findUnique({
      where: { userId },
      include: ARTISAN_INCLUDE as any,
    });

    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    return toLegacyProfile(profile) as any;
  },

  async getById(id: string) {
    const profile = await prisma.artisanProfile.findUnique({
      where: { id },
      include: ARTISAN_INCLUDE as any,
    });

    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return toLegacyProfile(profile) as any;
  },

  async list(query: ListArtisansQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where: Prisma.ArtisanProfileWhereInput = {
      isSuspended: false,
      applicationStatus: ApplicationStatus.ACTIVE,
      ...(query.applicationStatus && query.applicationStatus !== ApplicationStatus.ACTIVE
        ? { applicationStatus: query.applicationStatus }
        : {}),
      ...(query.category ? { categories: { some: { category: { name: { equals: query.category, mode: 'insensitive' } } } } } : {}),
      ...(query.query
        ? {
            OR: [
              { businessName: { contains: query.query, mode: 'insensitive' } },
              { bio: { contains: query.query, mode: 'insensitive' } },
              { user: { name: { contains: query.query, mode: 'insensitive' } } },
              { skills: { some: { skill: { name: { contains: query.query, mode: 'insensitive' } } } } },
            ],
          }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      prisma.artisanProfile.findMany({
        where,
        include: ARTISAN_INCLUDE as any,
        orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.artisanProfile.count({ where }),
    ]);

    return {
      items: items.map(toLegacyProfile) as any,
      meta: buildPaginationMeta(page, pageSize, totalItems),
    };
  },

  async upsertProfile(userId: string, input: UpsertArtisanProfileInput) {
    const { availability, skills, categories, ...rest } = input;

    const profile = await prisma.artisanProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...rest,
      },
      update: {
        ...rest,
      },
      include: ARTISAN_INCLUDE as any,
    });

    if (availability && availability.length > 0) {
      const profileRecord = profile.id ? profile : await prisma.artisanProfile.findUnique({ where: { userId } });
      if (profileRecord) {
        await prisma.artisanAvailability.deleteMany({ where: { artisanProfileId: profileRecord.id } });
        const dayMap: Record<string, DayOfWeek> = {
          monday: DayOfWeek.MONDAY,
          tuesday: DayOfWeek.TUESDAY,
          wednesday: DayOfWeek.WEDNESDAY,
          thursday: DayOfWeek.THURSDAY,
          friday: DayOfWeek.FRIDAY,
          saturday: DayOfWeek.SATURDAY,
          sunday: DayOfWeek.SUNDAY,
        };
        await prisma.artisanAvailability.createMany({
          data: availability.map((slot) => ({
            artisanProfileId: profileRecord.id,
            day: dayMap[slot.day.toLowerCase()] ?? DayOfWeek.MONDAY,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
          skipDuplicates: true,
        });
      }
    }

    if (skills && skills.length > 0) {
      const profileRecord = profile.id ? profile : await prisma.artisanProfile.findUnique({ where: { userId } });
      if (profileRecord) {
        const existingSkills = await prisma.skill.findMany({
          where: { id: { in: skills } },
        });

        const validSkillIds = new Set(existingSkills.map((s) => s.id));
        const invalidSkillIds = skills.filter((id) => !validSkillIds.has(id));
        if (invalidSkillIds.length > 0) {
          throw ApiError.badRequest(`Invalid skill IDs: ${invalidSkillIds.join(', ')}`);
        }

        await prisma.artisanSkill.deleteMany({ where: { artisanProfileId: profileRecord.id } });
        await prisma.artisanSkill.createMany({
          data: existingSkills.map((skill) => ({
            artisanProfileId: profileRecord.id,
            skillId: skill.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    if (categories && categories.length > 0) {
      const profileRecord = profile.id ? profile : await prisma.artisanProfile.findUnique({ where: { userId } });
      if (profileRecord) {
        await prisma.artisanCategory.deleteMany({ where: { artisanProfileId: profileRecord.id } });
        const categoryRecords = await prisma.category.findMany({
          where: { name: { in: categories.map((c) => c.trim()), mode: 'insensitive' } },
        });
        await prisma.artisanCategory.createMany({
          data: categoryRecords.map((cat) => ({
            artisanProfileId: profileRecord.id,
            categoryId: cat.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    return toLegacyProfile(profile) as any;
  },

  async addPortfolioItem(userId: string, input: AddPortfolioItemInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const item = await prisma.artisanPortfolio.create({
      data: {
        artisanProfileId: profile.id,
        imageUrl: input.imageUrl,
        caption: input.caption,
      },
    });

    return item;
  },

  async removePortfolioItem(userId: string, itemId: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const item = await prisma.artisanPortfolio.findUnique({ where: { id: itemId } });
    if (!item || item.artisanProfileId !== profile.id) {
      throw ApiError.notFound('Portfolio item not found.');
    }

    await prisma.artisanPortfolio.delete({ where: { id: itemId } });
    return { message: 'Portfolio item removed.' };
  },

  async listServices(artisanId: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id: artisanId } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return prisma.artisanService.findMany({
      where: { artisanProfileId: artisanId, isActive: true },
      include: { category: { select: { id: true, name: true, active: true } } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async createService(userId: string, input: CreateServiceInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) {
      throw ApiError.badRequest('Invalid category.');
    }

    const { categoryId, ...rest } = input;

    return prisma.artisanService.create({
      data: { artisanProfileId: profile.id, categoryId, ...rest },
      include: { category: { select: { id: true, name: true, active: true } } },
    });
  },

  async updateService(userId: string, serviceId: string, input: UpdateServiceInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const service = await prisma.artisanService.findUnique({ where: { id: serviceId } });
    if (!service || service.artisanProfileId !== profile.id) {
      throw ApiError.notFound('Service not found.');
    }

    const data: any = { ...input };
    if (input.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!category) {
        throw ApiError.badRequest('Invalid category.');
      }
      data.categoryId = input.categoryId;
    }

    return prisma.artisanService.update({
      where: { id: serviceId },
      data,
      include: { category: { select: { id: true, name: true, active: true } } },
    });
  },

  async deleteService(userId: string, serviceId: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const service = await prisma.artisanService.findUnique({ where: { id: serviceId } });
    if (!service || service.artisanProfileId !== profile.id) {
      throw ApiError.notFound('Service not found.');
    }

    await prisma.artisanService.update({ where: { id: serviceId }, data: { isActive: false } });
    return { message: 'Service removed.' };
  },

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

  async updateAvailability(userId: string, slots: any) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    await prisma.artisanAvailability.deleteMany({ where: { artisanProfileId: profile.id } });
    await prisma.artisanAvailability.createMany({
      data: (slots ?? []).map((slot: any) => ({
        artisanProfileId: profile.id,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
      skipDuplicates: true,
    });

    const updated = await prisma.artisanAvailability.findMany({
      where: { artisanProfileId: profile.id },
    });

    return updated.map((a) => ({
      day: (a.day as string).toLowerCase(),
      startTime: a.startTime,
      endTime: a.endTime,
    }));
  },

  async setVerification(id: string, status: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    let applicationStatus: ApplicationStatus;
    if (status === 'verified') applicationStatus = ApplicationStatus.ACTIVE;
    else if (status === 'rejected') applicationStatus = ApplicationStatus.REJECTED;
    else if (status === 'pending') applicationStatus = ApplicationStatus.PENDING_REVIEW;
    else applicationStatus = ApplicationStatus.CHANGES_REQUESTED;

    const updated = await prisma.artisanProfile.update({
      where: { id },
      data: {
        applicationStatus,
        verification: status,
      },
      include: ARTISAN_INCLUDE as any,
    });

    if (status === 'verified') {
      emitToUser(profile.userId, SOCKET_EVENTS.ARTISAN_VERIFIED, updated);
    }
    emitToAdmins(SOCKET_EVENTS.ARTISAN_VERIFIED, updated);

    return toLegacyProfile(updated) as any;
  },

  async setSuspended(id: string, suspended: boolean) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    return prisma.artisanProfile.update({
      where: { id },
      data: { isSuspended: suspended },
      include: ARTISAN_INCLUDE as any,
    });
  },

  async approveArtisan(id: string, adminId: string, notes?: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    const updated = await prisma.artisanProfile.update({
      where: { id },
      data: {
        applicationStatus: ApplicationStatus.ACTIVE,
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
        rejectionReason: null,
        reviewNotes: notes ?? undefined,
        verification: 'verified',
      },
      include: ARTISAN_INCLUDE as any,
    });

    const currentStatus = profile.applicationStatus;

    await prisma.artisanStatusChange.create({
      data: {
        artisanProfileId: profile.id,
        fromStatus: currentStatus,
        toStatus: ApplicationStatus.ACTIVE,
        changedByUserId: adminId,
        notes,
      },
    });

    emitToUser(profile.userId, SOCKET_EVENTS.ARTISAN_VERIFIED, updated);
    emitToAdmins(SOCKET_EVENTS.ARTISAN_VERIFIED, updated);

    return toLegacyProfile(updated) as any;
  },

  async rejectArtisan(id: string, adminId: string, reason: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    const updated = await prisma.artisanProfile.update({
      where: { id },
      data: {
        applicationStatus: ApplicationStatus.REJECTED,
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
        verification: 'rejected',
      },
      include: ARTISAN_INCLUDE as any,
    });

    const currentStatus = profile.applicationStatus;

    await prisma.artisanStatusChange.create({
      data: {
        artisanProfileId: profile.id,
        fromStatus: currentStatus,
        toStatus: ApplicationStatus.REJECTED,
        changedByUserId: adminId,
        notes: reason,
      },
    });

    emitToUser(profile.userId, SOCKET_EVENTS.ARTISAN_VERIFIED, updated);
    emitToAdmins(SOCKET_EVENTS.ARTISAN_VERIFIED, updated);

    return toLegacyProfile(updated) as any;
  },

  async requestChangesArtisan(id: string, adminId: string, changes: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    const updated = await prisma.artisanProfile.update({
      where: { id },
      data: {
        applicationStatus: ApplicationStatus.CHANGES_REQUESTED,
        reviewNotes: changes,
        verification: 'rejected',
      },
      include: ARTISAN_INCLUDE as any,
    });

    const currentStatus = profile.applicationStatus;

    await prisma.artisanStatusChange.create({
      data: {
        artisanProfileId: profile.id,
        fromStatus: currentStatus,
        toStatus: ApplicationStatus.CHANGES_REQUESTED,
        changedByUserId: adminId,
        notes: changes,
      },
    });

    emitToUser(profile.userId, SOCKET_EVENTS.ARTISAN_VERIFIED, updated);

    return toLegacyProfile(updated) as any;
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
