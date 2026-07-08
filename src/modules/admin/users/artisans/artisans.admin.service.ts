import { VerificationStatus } from '@prisma/client';
import { prisma } from '../../../../config/prisma';
import { parsePagination } from '../../../../utils/pagination';
import { buildPaginationMeta } from '../../../../utils/apiResponse';

/**
 * Admin-scoped listing of artisan accounts. Includes suspended artisans
 * (mobile listing hides them) so moderators can see the full pool.
 */
export const artisansAdminService = {
  async listArtisans(query: {
    verification?: VerificationStatus;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = {
      ...(query.verification ? { verification: query.verification } : {}),
      ...(query.search
        ? {
            OR: [
              { businessName: { contains: query.search, mode: 'insensitive' as const } },
              { user: { name: { contains: query.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      prisma.artisanProfile.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, isSuspended: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.artisanProfile.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },
};
