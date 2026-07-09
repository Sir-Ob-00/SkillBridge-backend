import { Prisma, ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { emitToUser, emitToAdmins } from '../../sockets/io';
import { SOCKET_EVENTS } from '../../sockets/events';
import { ApproveArtisanInput, RejectArtisanInput, RequestChangesInput, ListPendingQuery } from './admin.validators';

const ADMIN_INCLUDE = {
  user: { select: { id: true, name: true, email: true, avatarUrl: true, isSuspended: true } },
  skills: true,
  categories: { include: { category: { select: { id: true, name: true, active: true } } } },
  availability: true,
  portfolio: { orderBy: { createdAt: 'desc' as const } },
  services: { where: { isActive: true } },
  verificationDoc: true,
  statusHistory: { orderBy: { createdAt: 'desc' as const }, take: 5 },
} satisfies Prisma.ArtisanProfileInclude as any;

export const adminService = {
  async approve(id: string, adminId: string, notes?: string) {
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
      include: ADMIN_INCLUDE as any,
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

    return updated;
  },

  async reject(id: string, adminId: string, reason: string) {
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
      include: ADMIN_INCLUDE as any,
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

    return updated;
  },

  async requestChanges(id: string, adminId: string, changes: string) {
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
      include: ADMIN_INCLUDE as any,
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

    return updated;
  },

  async listPending(query: ListPendingQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where: Prisma.ArtisanProfileWhereInput = {
      applicationStatus: {
        in: [ApplicationStatus.PENDING_REVIEW, ApplicationStatus.UNDER_REVIEW],
      },
    };

    const [items, totalItems] = await Promise.all([
      prisma.artisanProfile.findMany({
        where,
        include: ADMIN_INCLUDE as any,
        orderBy: { submittedAt: 'asc' },
        skip,
        take,
      }),
      prisma.artisanProfile.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },
};

function parsePagination(query: ListPendingQuery) {
  const page = Math.max(1, query.page);
  const pageSize = Math.min(Math.max(1, query.pageSize), 100);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

function buildPaginationMeta(page: number, pageSize: number, totalItems: number) {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}
