import { Prisma, ApplicationStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { emitToUser } from '../../../sockets/io';
import { SOCKET_EVENTS } from '../../../sockets/events';
import {
  PersonalInfoInput,
  BusinessInfoInput,
  SkillsInput,
  ServicesInput,
  AvailabilityInput,
  PortfolioInput,
  VerificationInput,
  SubmitInput,
} from './onboarding.validators';

interface OnboardingStatusOutput {
  status: ApplicationStatus;
  completedSteps: string[];
  submittedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
}

const STEP_ORDER = [
  'personal',
  'business',
  'skills',
  'services',
  'availability',
  'portfolio',
  'verification',
] as const;

export const onboardingService = {
  async getOnboardingStatus(userId: string): Promise<OnboardingStatusOutput> {
    const profile = await prisma.artisanProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        applicationStatus: true,
        submittedAt: true,
        reviewedAt: true,
        reviewNotes: true,
        rejectionReason: true,
        businessName: true,
        pricingFrom: true,
      },
    });

    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const [skills, categories, services, availability, portfolio, verification] = await Promise.all([
      prisma.artisanSkill.count({ where: { artisanProfileId: profile.id } }),
      prisma.artisanCategory.count({ where: { artisanProfileId: profile.id } }),
      prisma.artisanService.count({ where: { artisanProfileId: profile.id } }),
      prisma.artisanAvailability.count({ where: { artisanProfileId: profile.id } }),
      prisma.artisanPortfolio.count({ where: { artisanProfileId: profile.id } }),
      prisma.artisanVerification.findFirst({ where: { artisanProfileId: profile.id } }),
    ]);

    const completedSteps: string[] = [];

    if (profile.userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true },
      });
      if (user?.phone) completedSteps.push('personal');
    }

    if (profile.businessName && profile.pricingFrom !== null) completedSteps.push('business');
    if (skills > 0) completedSteps.push('skills');
    if (categories > 0) completedSteps.push('categories');
    if (services > 0) completedSteps.push('services');
    if (availability > 0) completedSteps.push('availability');
    if (portfolio > 0) completedSteps.push('portfolio');
    if (verification?.verificationImageUrl) completedSteps.push('verification');

    return {
      status: profile.applicationStatus,
      completedSteps,
      submittedAt: profile.submittedAt?.toISOString(),
      reviewedAt: profile.reviewedAt?.toISOString(),
      reviewNotes: profile.reviewNotes ?? undefined,
      rejectionReason: profile.rejectionReason ?? undefined,
    };
  },

  async updatePersonal(userId: string, input: PersonalInfoInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        phone: input.phone,
        avatarUrl: input.avatarUrl ?? undefined,
      },
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
    });

    return user;
  },

  async updateBusiness(userId: string, input: BusinessInfoInput) {
    const profile = await prisma.artisanProfile.upsert({
      where: { userId },
      create: {
        userId,
        businessName: input.businessName,
        bio: input.bio ?? undefined,
        location: input.location ?? undefined,
        pricingFrom: input.pricingFrom ?? undefined,
      },
      update: {
        businessName: input.businessName,
        bio: input.bio ?? undefined,
        location: input.location ?? undefined,
        pricingFrom: input.pricingFrom ?? undefined,
      },
      select: {
        id: true,
        userId: true,
        businessName: true,
        bio: true,
        pricingFrom: true,
        location: true,
        applicationStatus: true,
      },
    });

    return profile;
  },

  async updateSkills(userId: string, input: SkillsInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    await prisma.$transaction([
      prisma.artisanSkill.deleteMany({ where: { artisanProfileId: profile.id } }),
      prisma.artisanSkill.createMany({
        data: input.names.map((name) => ({
          artisanProfileId: profile.id,
          name: name.trim(),
        })),
        skipDuplicates: true,
      }),
    ]);

    return input.names;
  },

  async updateServices(userId: string, input: ServicesInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const services = await prisma.$transaction(
      input.items.map((item) =>
        prisma.artisanService.create({
          data: {
            artisanProfileId: profile.id,
            title: item.title.trim(),
            description: item.description.trim(),
            price: item.price,
            durationMinutes: item.durationMinutes,
            categoryName: item.categoryName.trim(),
            isActive: item.isActive,
          },
        })
      )
    );

    return services;
  },

  async updateAvailability(userId: string, input: AvailabilityInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    await prisma.$transaction([
      prisma.artisanAvailability.deleteMany({ where: { artisanProfileId: profile.id } }),
      prisma.artisanAvailability.createMany({
        data: input.slots.map((slot) => ({
          artisanProfileId: profile.id,
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
        skipDuplicates: true,
      }),
    ]);

    const slots = await prisma.artisanAvailability.findMany({
      where: { artisanProfileId: profile.id },
      orderBy: { day: 'asc' },
    });

    return slots;
  },

  async updatePortfolio(userId: string, input: PortfolioInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const items = await prisma.$transaction(
      input.items.map((item) =>
        prisma.artisanPortfolio.create({
          data: {
            artisanProfileId: profile.id,
            imageUrl: item.imageUrl,
            caption: item.caption ?? undefined,
          },
        })
      )
    );

    return items;
  },

  async updateVerification(userId: string, input: VerificationInput) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    const verification = await prisma.artisanVerification.upsert({
      where: { artisanProfileId: profile.id },
      create: {
        artisanProfileId: profile.id,
        institution: input.institution.trim(),
        studentIdNumber: input.studentIdNumber.trim(),
        verificationImageUrl: input.verificationImageUrl,
        reviewStatus: 'PENDING',
      },
      update: {
        institution: input.institution.trim(),
        studentIdNumber: input.studentIdNumber.trim(),
        verificationImageUrl: input.verificationImageUrl,
        reviewStatus: 'PENDING',
        reviewNotes: null,
        reviewedByUserId: null,
        reviewedAt: null,
      },
    });

    return verification;
  },

  async submitApplication(userId: string, input: SubmitInput) {
    const profile = await prisma.artisanProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }

    if (profile.applicationStatus === ApplicationStatus.ACTIVE) {
      throw ApiError.badRequest('Your application has already been approved.');
    }

    const missingFields: string[] = [];

    if (!profile.businessName || profile.businessName.trim().length < 2) {
      missingFields.push('businessName');
    }
    if (profile.pricingFrom === null || profile.pricingFrom === undefined) {
      missingFields.push('pricingFrom');
    }

    const [skillCount, categoryCount, serviceCount, availabilityCount, verification] = await Promise.all([
      prisma.artisanSkill.count({ where: { artisanProfileId: profile.id } }),
      prisma.artisanCategory.count({ where: { artisanProfileId: profile.id } }),
      prisma.artisanService.count({ where: { artisanProfileId: profile.id } }),
      prisma.artisanAvailability.count({ where: { artisanProfileId: profile.id } }),
      prisma.artisanVerification.findFirst({ where: { artisanProfileId: profile.id } }),
    ]);

    if (skillCount === 0) missingFields.push('skills');
    if (categoryCount === 0) missingFields.push('categories');
    if (serviceCount === 0) missingFields.push('services');
    if (availabilityCount === 0) missingFields.push('availability');
    if (!verification?.verificationImageUrl) missingFields.push('verificationImage');

    if (missingFields.length > 0) {
      throw ApiError.badRequest(
        `Application incomplete. Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      );
    }

    const currentStatus = profile.applicationStatus;

    const updated = await prisma.artisanProfile.update({
      where: { id: profile.id },
      data: {
        applicationStatus: ApplicationStatus.PENDING_REVIEW,
        submittedAt: new Date(),
      },
    });

    await prisma.artisanStatusChange.create({
      data: {
        artisanProfileId: profile.id,
        fromStatus: currentStatus,
        toStatus: ApplicationStatus.PENDING_REVIEW,
        changedByUserId: userId,
        notes: input.notes ?? undefined,
      },
    });

    emitToUser(profile.userId, SOCKET_EVENTS.ARTISAN_VERIFIED, updated);

    return updated;
  },
};
