import { prisma } from '../../../config/prisma';
import { VerificationReviewStatus } from '@prisma/client';

export const artisanVerificationRepository = {
  async findByArtisan(artisanId: string) {
    return prisma.artisanVerification.findUnique({ where: { artisanId } });
  },

  async upsert(
    artisanId: string,
    data: { institution: string; studentIdNumber: string; verificationImageUrl: string }
  ) {
    return prisma.artisanVerification.upsert({
      where: { artisanId },
      update: data,
      create: {
        artisanId,
        reviewStatus: VerificationReviewStatus.PENDING,
        ...data,
      },
    });
  },
};
