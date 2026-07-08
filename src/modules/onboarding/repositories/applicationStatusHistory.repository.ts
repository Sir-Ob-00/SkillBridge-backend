import { prisma } from '../../../config/prisma';
import { ApplicationStatus } from '@prisma/client';

export const applicationStatusHistoryRepository = {
  async create(artisanId: string, status: ApplicationStatus, note?: string, changedBy?: string) {
    return prisma.applicationStatusHistory.create({
      data: { artisanId, status, note, changedBy },
    });
  },

  async list(artisanId: string) {
    return prisma.applicationStatusHistory.findMany({
      where: { artisanId },
      orderBy: { createdAt: 'desc' },
    });
  },
};
