import { Prisma, ApplicationStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { parsePagination } from '../../../utils/pagination';
import { buildPaginationMeta } from '../../../utils/apiResponse';

const APPLICATION_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      profileImageUrl: true,
       phone: true,
       createdAt: true,
     },
   },
  skills: { include: { skill: { select: { id: true, name: true } } } },
  categories: { include: { category: { select: { id: true, name: true, active: true } } } },
  services: { include: { category: { select: { id: true, name: true } } } },
  availability: true,
  portfolio: true,
  verificationDoc: true,
  statusHistory: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.ArtisanProfileInclude;

export const applicationsService = {
  async list(query: { status?: ApplicationStatus; page: number; pageSize: number }) {
    const { page, pageSize, skip, take } = parsePagination({ page: query.page, pageSize: query.pageSize });

    const where: Prisma.ArtisanProfileWhereInput = {
      ...(query.status ? { applicationStatus: query.status } : {}),
    };

    const [items, totalItems] = await Promise.all([
      prisma.artisanProfile.findMany({
        where,
        include: APPLICATION_INCLUDE as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.artisanProfile.count({ where }),
    ]);

    return {
      items: items.map((profile) => ({
        id: profile.id,
        userId: profile.userId,
        businessName: profile.businessName,
        bio: profile.bio,
        pricingFrom: profile.pricingFrom,
        location: profile.location,
        applicationStatus: profile.applicationStatus,
        isSuspended: profile.isSuspended,
        rejectionReason: profile.rejectionReason,
        reviewNotes: profile.reviewNotes,
        reviewedAt: profile.reviewedAt?.toISOString(),
        submittedAt: profile.submittedAt?.toISOString(),
        createdAt: profile.createdAt.toISOString(),
        user: profile.user,
        skills: (profile.skills ?? []).map((s: any) => s.skill?.name).filter(Boolean),
        categories: (profile.categories ?? []).map((c: any) => c.category?.name).filter(Boolean),
        services: profile.services ?? [],
        availability: profile.availability ?? [],
        portfolio: profile.portfolio ?? [],
        verification: profile.verificationDoc,
        statusHistory: profile.statusHistory ?? [],
      })),
      meta: buildPaginationMeta(page, pageSize, totalItems),
    };
  },

  async getById(id: string) {
    const profile = await prisma.artisanProfile.findUnique({
      where: { id },
      include: APPLICATION_INCLUDE as any,
    });

    if (!profile) {
      throw ApiError.notFound('Application not found.');
    }

    return {
      id: profile.id,
      userId: profile.userId,
      businessName: profile.businessName,
      bio: profile.bio,
      pricingFrom: profile.pricingFrom,
      location: profile.location,
      applicationStatus: profile.applicationStatus,
      isSuspended: profile.isSuspended,
      rejectionReason: profile.rejectionReason,
      reviewNotes: profile.reviewNotes,
      reviewedAt: profile.reviewedAt?.toISOString(),
      submittedAt: profile.submittedAt?.toISOString(),
      createdAt: profile.createdAt.toISOString(),
      user: profile.user,
      skills: (profile.skills ?? []).map((s: any) => s.skill?.name).filter(Boolean),
      categories: (profile.categories ?? []).map((c: any) => c.category?.name).filter(Boolean),
      services: profile.services ?? [],
      availability: profile.availability ?? [],
      portfolio: profile.portfolio ?? [],
      verification: profile.verificationDoc,
      statusHistory: profile.statusHistory ?? [],
    };
  },

  async approve(id: string, adminId: string, notes?: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Application not found.');
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

    return updated;
  },

  async reject(id: string, adminId: string, reason: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Application not found.');
    }

    const updated = await prisma.artisanProfile.update({
      where: { id },
      data: {
        applicationStatus: ApplicationStatus.REJECTED,
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
        reviewNotes: reason,
      },
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

    return updated;
  },

  async requestChanges(id: string, adminId: string, notes: string) {
    const profile = await prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) {
      throw ApiError.notFound('Application not found.');
    }

    const updated = await prisma.artisanProfile.update({
      where: { id },
      data: {
        applicationStatus: ApplicationStatus.CHANGES_REQUESTED,
        reviewNotes: notes,
      },
    });

    const currentStatus = profile.applicationStatus;

    await prisma.artisanStatusChange.create({
      data: {
        artisanProfileId: profile.id,
        fromStatus: currentStatus,
        toStatus: ApplicationStatus.CHANGES_REQUESTED,
        changedByUserId: adminId,
        notes,
      },
    });

    return updated;
  },
};
