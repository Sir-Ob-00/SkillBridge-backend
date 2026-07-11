import { Prisma, ApplicationStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { artisansService } from '../../mobile/artisans/artisans.service';
import { usersService } from '../../users/users.service';
import { ApiError } from '../../../utils/ApiError';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';
import { UpdateArtisanInput, ArtisanStatusInput, ListArtisansQuery } from './artisans.validators';

const ARTISAN_INCLUDE = {
  user: {
    select: { id: true, name: true, email: true, phone: true, profileImageUrl: true, isSuspended: true },
  },
  portfolio: { orderBy: { createdAt: 'desc' as const } },
  skills: { include: { skill: { select: { id: true, name: true } } } },
  categories: { include: { category: { select: { id: true, name: true } } } },
  services: { include: { category: { select: { id: true, name: true } } } },
  availability: true,
  verificationDoc: true,
} satisfies Prisma.ArtisanProfileInclude;

function mapVerification(status: ApplicationStatus): string {
  if (status === ApplicationStatus.ACTIVE) return 'verified';
  if (status === ApplicationStatus.REJECTED) return 'rejected';
  return 'unverified';
}

export const adminArtisansService = {
  async list(query: ListArtisansQuery) {
    const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);

    const where: Prisma.ArtisanProfileWhereInput = {};
    if (query.applicationStatus) where.applicationStatus = query.applicationStatus;
    if (query.isSuspended) where.isSuspended = query.isSuspended === 'true';
    if (query.search) {
      where.OR = [
        { businessName: { contains: query.search, mode: 'insensitive' } },
        { user: { name: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      prisma.artisanProfile.findMany({
        where,
        include: ARTISAN_INCLUDE,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      prisma.artisanProfile.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  async statistics() {
    const [total, active, pending, rejected, suspended] = await Promise.all([
      prisma.artisanProfile.count(),
      prisma.artisanProfile.count({ where: { applicationStatus: ApplicationStatus.ACTIVE } }),
      prisma.artisanProfile.count({ where: { applicationStatus: ApplicationStatus.PENDING_REVIEW } }),
      prisma.artisanProfile.count({ where: { applicationStatus: ApplicationStatus.REJECTED } }),
      prisma.artisanProfile.count({ where: { isSuspended: true } }),
    ]);
    return { total, active, pending, rejected, suspended };
  },

  async export() {
    return prisma.artisanProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true, isSuspended: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  getById(id: string) {
    return artisansService.getById(id);
  },

  getServices(id: string) {
    return artisansService.listServices(id);
  },

  async getPortfolio(id: string) {
    return prisma.artisanPortfolio.findMany({
      where: { artisanProfileId: id },
      orderBy: { createdAt: 'desc' },
    });
  },

  getAvailability(id: string) {
    return artisansService.getAvailability(id);
  },

  async update(id: string, input: UpdateArtisanInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }

    const { businessName, bio, pricingFrom, location, isSuspended, applicationStatus, ...userFields } =
      input;

    if (applicationStatus) {
      await prisma.artisanProfile.update({
        where: { id },
        data: { applicationStatus, verification: mapVerification(applicationStatus) },
      });
    }

    if (businessName !== undefined || bio !== undefined || pricingFrom !== undefined || location !== undefined) {
      await prisma.artisanProfile.update({
        where: { id },
        data: { businessName, bio, pricingFrom, location },
      });
    }

    if (isSuspended !== undefined) {
      await prisma.artisanProfile.update({ where: { id }, data: { isSuspended } });
      await usersService.suspendUser(profile.userId, isSuspended);
    }

    if (userFields.name || userFields.email || userFields.phone) {
      await prisma.user.update({ where: { id: profile.userId }, data: userFields });
    }

    return artisansService.getById(id);
  },

  async setStatus(id: string, input: ArtisanStatusInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }
    return prisma.artisanProfile.update({
      where: { id },
      data: { applicationStatus: input.applicationStatus, verification: mapVerification(input.applicationStatus) },
      include: ARTISAN_INCLUDE,
    });
  },

  async suspend(id: string, suspend: boolean) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }
    await prisma.artisanProfile.update({ where: { id }, data: { isSuspended: suspend } });
    await usersService.suspendUser(profile.userId, suspend);
    return artisansService.getById(id);
  },

  async remove(id: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }
    await prisma.user.delete({ where: { id: profile.userId } });
    return { message: 'Artisan deleted successfully.' };
  },
};
