import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';
import { artisansService } from '../../mobile/artisans/artisans.service';
import { ListVerificationsQuery } from './admin.verification.validators';

const ARTISAN_INCLUDE = {
  user: {
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, isSuspended: true },
  },
  portfolio: { orderBy: { createdAt: 'desc' as const } },
  verification: true,
} satisfies Prisma.ArtisanProfileInclude;

export const adminVerificationService = {
  async list(query: ListVerificationsQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = { status: query.status };

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

  async approve(id: string, note: string | undefined, changedBy: string | undefined) {
    return artisansService.approve(id, note, changedBy);
  },

  async reject(id: string, note: string, changedBy: string | undefined) {
    return artisansService.reject(id, note, changedBy);
  },

  async requestChanges(id: string, note: string, changedBy: string | undefined) {
    return artisansService.requestChanges(id, note, changedBy);
  },
};
