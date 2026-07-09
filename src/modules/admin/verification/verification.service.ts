import { prisma } from '../../../config/prisma';

export const verificationService = {
  async getStats() {
    const pending = await prisma.artisanProfile.count({ where: { applicationStatus: 'PENDING_REVIEW' } });
    const underReview = await prisma.artisanProfile.count({ where: { applicationStatus: 'UNDER_REVIEW' } });
    const approved = await prisma.artisanProfile.count({ where: { applicationStatus: 'ACTIVE' } });
    const rejected = await prisma.artisanProfile.count({ where: { applicationStatus: 'REJECTED' } });

    return { pending, underReview, approved, rejected };
  },
};
