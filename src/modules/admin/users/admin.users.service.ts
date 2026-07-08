import { Role } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';
import { usersService } from '../../users/users.service';
import { AdminUpdateUserInput, ListAdminUsersQuery } from './admin.users.validators';

const ADMIN_ROLES: Role[] = [Role.admin, Role.super_admin];

export const adminUsersService = {
  /** Lists users, optionally filtered by role or search term. */
  async list(query: ListAdminUsersQuery) {
    return usersService.listUsers(query);
  },

  async getById(id: string) {
    return usersService.getById(id);
  },

  async update(id: string, input: AdminUpdateUserInput) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return prisma.user.update({
      where: { id },
      data: input,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async remove(id: string, requestingAdminId: string) {
    if (id === requestingAdminId) {
      throw ApiError.badRequest('You cannot delete your own account.');
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (user.role === Role.super_admin) {
      throw ApiError.forbidden('Super admin accounts cannot be deleted.');
    }

    const result = await usersService.deleteUser(id);
    return result;
  },

  async listAdministrators(query: ListAdminUsersQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = query.search
      ? {
          role: { in: ADMIN_ROLES },
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : { role: { in: ADMIN_ROLES } };

    const [items, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          avatarUrl: true,
          isSuspended: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },
};
