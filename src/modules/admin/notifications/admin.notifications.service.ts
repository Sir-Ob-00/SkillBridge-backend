import { Role } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { emitToUser, emitToAdmins } from '../../../sockets/io';
import { SOCKET_EVENTS } from '../../../sockets/events';
import { CreateNotificationInput, BroadcastNotificationInput } from './admin.notifications.validators';

export const adminNotificationsService = {
  async list(opts: {
    targetUserId?: string;
    targetRole?: Role;
    read?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { page, pageSize, skip, take } = parsePagination(opts as Record<string, unknown>);

    const where: Record<string, unknown> = {};
    if (opts.targetUserId) where.targetUserId = opts.targetUserId;
    if (opts.targetRole) where.targetRole = opts.targetRole;
    if (opts.read !== undefined) where.read = opts.read;

    const [items, totalItems] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  async statistics() {
    const [total, unread] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { read: false } }),
    ]);
    return { total, unread };
  },

  async create(createdBy: string | undefined, input: CreateNotificationInput) {
    const record = await prisma.notification.create({
      data: {
        title: input.title,
        message: input.message,
        type: input.type ?? 'info',
        targetUserId: input.targetUserId ?? null,
        targetRole: input.targetRole ?? null,
        createdBy: createdBy ?? null,
      },
    });

    if (input.targetUserId) {
      emitToUser(input.targetUserId, SOCKET_EVENTS.NOTIFICATION_SENT, record);
    } else {
      emitToAdmins(SOCKET_EVENTS.NOTIFICATION_SENT, record);
    }

    return record;
  },

  /**
   * Expands an audience into one persisted notification per recipient.
   * `userIds` targets specific users; otherwise `audience` selects a role group
   * (or all users) as a single role-targeted/broadcast notification.
   */
  async broadcast(createdBy: string | undefined, input: BroadcastNotificationInput) {
    const created: unknown[] = [];

    if (input.userIds && input.userIds.length > 0) {
      for (const userId of input.userIds) {
        const record = await prisma.notification.create({
          data: {
            title: input.title,
            message: input.message,
            type: input.type ?? 'info',
            targetUserId: userId,
            createdBy: createdBy ?? null,
          },
        });
        emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_SENT, record);
        created.push(record);
      }
      return created;
    }

    const audiences = input.audience === 'all'
      ? [Role.student, Role.artisan, Role.admin, Role.super_admin]
      : [input.audience as Role];

    for (const role of audiences) {
      const record = await prisma.notification.create({
        data: {
          title: input.title,
          message: input.message,
          type: input.type ?? 'info',
          targetRole: role,
          createdBy: createdBy ?? null,
        },
      });
      emitToAdmins(SOCKET_EVENTS.NOTIFICATION_SENT, record);
      created.push(record);
    }

    return created;
  },

  async markRead(id: string, read: boolean) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw ApiError.notFound('Notification not found.');
    }
    return prisma.notification.update({ where: { id }, data: { read } });
  },

  async remove(id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw ApiError.notFound('Notification not found.');
    }
    await prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted.' };
  },
};
