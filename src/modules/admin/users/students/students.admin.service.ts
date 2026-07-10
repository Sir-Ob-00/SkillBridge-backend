import { prisma } from '../../../../config/prisma';
import { parsePagination } from '../../../../utils/pagination';
import { buildPaginationMeta } from '../../../../utils/apiResponse';

/**
 * Admin-scoped listing of student accounts, joined with their student profiles.
 */
export const studentsAdminService = {
  async listStudents(query: { search?: string; page?: number; pageSize?: number }) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = query.search
      ? {
          user: {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
            ],
          },
        }
      : {};

    const [items, totalItems] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, profileImageUrl: true, isSuspended: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.studentProfile.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },
};
