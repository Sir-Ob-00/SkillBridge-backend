import { Prisma, ApplicationStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';
import { artisansService } from '../../mobile/artisans/artisans.service';
import { ListVerificationsQuery } from './admin.verification.validators';

const ARTISAN_INCLUDE = {
  user: {
    select: { id: true, name: true, email: true, phone: true, profileImageUrl: true, isSuspended: true },
  },
  portfolio: { orderBy: { createdAt: 'desc' as const } },
  verificationDoc: true,
} satisfies Prisma.ArtisanProfileInclude;

export const adminVerificationService = {
  async list(query: ListVerificationsQuery) {
    const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);

    const where = { applicationStatus: query.status };

    const [items, totalItems] = await Promise.all([
      prisma.artisanProfile.findMany({
        where,
        include: ARTISAN_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.artisanProfile.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  async getById(id: string) {
    return artisansService.getById(id);
  },

  async statistics() {
    const [pending, underReview, changesRequested, active, rejected, total] = await Promise.all([
      prisma.artisanProfile.count({ where: { applicationStatus: ApplicationStatus.PENDING_REVIEW } }),
      prisma.artisanProfile.count({ where: { applicationStatus: ApplicationStatus.UNDER_REVIEW } }),
      prisma.artisanProfile.count({ where: { applicationStatus: ApplicationStatus.CHANGES_REQUESTED } }),
      prisma.artisanProfile.count({ where: { applicationStatus: ApplicationStatus.ACTIVE } }),
      prisma.artisanProfile.count({ where: { applicationStatus: ApplicationStatus.REJECTED } }),
      prisma.artisanProfile.count(),
    ]);
    return { pending, underReview, changesRequested, active, rejected, total };
  },

  async getDocuments(id: string) {
    const profile = await prisma.artisanProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, profileImageUrl: true } },
        verificationDoc: true,
        portfolio: { orderBy: { createdAt: 'desc' as const } },
        services: { include: { category: { select: { id: true, name: true } } } },
        categories: { include: { category: { select: { id: true, name: true } } } },
      },
    });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }
    return profile;
  },

  async approve(id: string, note: string | undefined, changedBy: string) {
    return artisansService.approveArtisan(id, changedBy, note);
  },

  async reject(id: string, note: string, changedBy: string) {
    return artisansService.rejectArtisan(id, changedBy, note);
  },

  async requestChanges(id: string, note: string, changedBy: string) {
    return artisansService.requestChangesArtisan(id, changedBy, note);
  },

  async addNote(id: string, note: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Artisan not found.');
    }
    return prisma.artisanProfile.update({
      where: { id },
      data: { reviewNotes: note },
      include: ARTISAN_INCLUDE,
    });
  },

  async setStatus(id: string, status: string) {
    return artisansService.setVerification(id, status);
  },
};
