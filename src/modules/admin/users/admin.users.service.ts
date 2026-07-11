import { Role } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';
import { usersService } from '../../users/users.service';
import { AdminUpdateUserInput, ListAdminUsersQuery, CreateAdminInput } from './admin.users.validators';
import { hashPassword } from '../../../utils/password';

const ADMIN_ROLES: Role[] = [Role.admin, Role.super_admin];

export const adminUsersService = {
  async list(query: ListAdminUsersQuery) {
    return usersService.listUsers(query);
  },

  async getById(id: string) {
    return usersService.getById(id);
  },

  async createAdmin(input: CreateAdminInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(input.password);

    return prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: passwordHash,
        role: input.role,
        phone: input.phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        profileImageUrl: true,
        isSuspended: true,
        createdAt: true,
      },
    });
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
        profileImageUrl: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async updateStatus(id: string, suspend: boolean) {
    const user = await prisma.user.update({
      where: { id },
      data: { isSuspended: suspend },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        profileImageUrl: true,
        isSuspended: true,
        createdAt: true,
      },
    });

    if (suspend) {
      await prisma.refreshToken.updateMany({
        where: { userId: id, revoked: false },
        data: { revoked: true },
      });
    }

    return user;
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
    const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);

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
          profileImageUrl: true,
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
