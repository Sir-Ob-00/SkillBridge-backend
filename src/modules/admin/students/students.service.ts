import { Role } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { adminUsersService } from '../users/admin.users.service';
import { usersService } from '../../users/users.service';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';
import type { ListStudentsQuery, UpdateStudentInput } from './students.validators';

const STUDENT_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  profileImageUrl: true,
  isSuspended: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const adminStudentsService = {
  async list(query: ListStudentsQuery) {
    const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);

    const where: Record<string, unknown> = { role: Role.student };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isSuspended) {
      where.isSuspended = query.isSuspended === 'true';
    }

    const [items, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        select: STUDENT_SELECT,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  async statistics() {
    const [total, active, suspended] = await Promise.all([
      prisma.user.count({ where: { role: Role.student } }),
      prisma.user.count({ where: { role: Role.student, isSuspended: false } }),
      prisma.user.count({ where: { role: Role.student, isSuspended: true } }),
    ]);
    return { total, active, suspended };
  },

  async export() {
    return prisma.user.findMany({
      where: { role: Role.student },
      select: STUDENT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  },

  getById(id: string) {
    return adminUsersService.getById(id);
  },

  update(id: string, input: UpdateStudentInput) {
    return adminUsersService.update(id, input);
  },

  suspend(id: string, suspend: boolean) {
    return usersService.suspendUser(id, suspend);
  },

  remove(id: string, requestingAdminId: string) {
    return adminUsersService.remove(id, requestingAdminId);
  },
};
