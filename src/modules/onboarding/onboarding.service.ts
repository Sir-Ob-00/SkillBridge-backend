import { ApplicationStatus, VerificationReviewStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { usersService } from '../../users/users.service';
import { artisansService } from '../../mobile/artisans/artisans.service';
import { skillsService } from '../../skills/skills.service';
import { uploadToCloudinary } from '../../../utils/cloudinary';
import { artisanProfileRepository } from './repositories/artisanProfile.repository';
import { artisanVerificationRepository } from './repositories/artisanVerification.repository';
import { applicationStatusHistoryRepository } from './repositories/applicationStatusHistory.repository';
import { artisanServiceRepository } from './repositories/artisanService.repository';
import { OnboardingStatusDto } from './onboarding.dtos';
import {
  PersonalInput,
  BusinessInput,
  SkillsInput,
  ServicesInput,
  AvailabilityInput,
  StudentVerificationInput,
} from './onboarding.validators';

interface LoadedProfile {
  id: string;
  businessName: string | null;
  bio: string | null;
  pricingFrom: number | null;
  yearsOfExperience: number | null;
  location: string | null;
  user: { name: string | null; phone: string | null };
  skills: unknown[];
  categories: unknown[];
  services: unknown[];
  availability: unknown[];
  portfolio: unknown[];
  verification: {
    institution: string | null;
    studentIdNumber: string | null;
    verificationImageUrl: string | null;
  } | null;
}

const computeStatus = (profile: LoadedProfile): OnboardingStatusDto => {
  const personal = !!(profile.user.name && profile.user.phone);
  const skills = profile.skills.length > 0;
  const categories = profile.categories.length > 0;
  const business = !!(
    profile.businessName &&
    profile.bio &&
    profile.pricingFrom !== null &&
    profile.yearsOfExperience !== null &&
    profile.location &&
    skills &&
    categories
  );
  const services = profile.services.length > 0;
  const availability = profile.availability.length > 0;
  const portfolio = profile.portfolio.length > 0;
  const studentVerification = !!(
    profile.verification &&
    profile.verification.institution &&
    profile.verification.studentIdNumber &&
    profile.verification.verificationImageUrl
  );

  const steps = { personal, business, skills, services, availability, portfolio, studentVerification };
  const required = Object.entries(steps).filter(([, done]) => !done).map(([name]) => name);
  const canSubmit = required.length === 0;

  return {
    artisanId: profile.id,
    applicationStatus: (profile as any).status,
    verification: profile.verification
      ? {
          reviewStatus: (profile.verification as any).reviewStatus,
          institution: profile.verification.institution ?? undefined,
          studentIdNumber: profile.verification.studentIdNumber ?? undefined,
          hasImage: !!profile.verification.verificationImageUrl,
        }
      : null,
    steps,
    canSubmit,
    missing: required,
  };
};

export const onboardingService = {
  async getStatus(userId: string): Promise<OnboardingStatusDto> {
    const profile = (await artisanProfileRepository.findByUserId(userId)) as unknown as LoadedProfile | null;
    if (!profile) {
      throw ApiError.notFound('Artisan profile not found.');
    }
    return computeStatus(profile);
  },

  async updatePersonal(userId: string, input: PersonalInput) {
    await usersService.updateProfile(userId, input);
    return this.getStatus(userId);
  },

  async updateBusiness(userId: string, input: BusinessInput) {
    if (input.skills) await skillsService.assertValid(input.skills);
    await artisansService.upsertProfile(userId, input);
    return this.getStatus(userId);
  },

  async updateSkills(userId: string, input: SkillsInput) {
    const profile = await artisanProfileRepository.findByUserId(userId);
    if (!profile) throw ApiError.notFound('Artisan profile not found.');
    await artisansService.replaceSkills(profile.id, input.skills);
    return this.getStatus(userId);
  },

  async updateServices(userId: string, input: ServicesInput) {
    const profile = await artisanProfileRepository.findByUserId(userId);
    if (!profile) throw ApiError.notFound('Artisan profile not found.');
    await artisanServiceRepository.replaceAll(profile.id, input.services);
    return this.getStatus(userId);
  },

  async updateAvailability(userId: string, input: AvailabilityInput) {
    const profile = await artisanProfileRepository.findByUserId(userId);
    if (!profile) throw ApiError.notFound('Artisan profile not found.');
    await artisansService.replaceAvailability(profile.id, input.slots);
    return this.getStatus(userId);
  },

  async updatePortfolioMetadata(userId: string, items: { id: string; title?: string; description?: string }[]) {
    const profile = await artisanProfileRepository.findByUserId(userId);
    if (!profile) throw ApiError.notFound('Artisan profile not found.');

    await Promise.all(
      items.map((item) =>
        prisma.artisanPortfolio.update({
          where: { id: item.id },
          data: {
            ...(item.title !== undefined ? { title: item.title } : {}),
            ...(item.description !== undefined ? { description: item.description } : {}),
          },
        })
      )
    );
    return this.getStatus(userId);
  },

  async addPortfolioItem(userId: string, input: { title: string; description?: string }, file: any) {
    const item = await artisansService.addPortfolioItem(userId, input, file);
    return item;
  },

  async removePortfolioItem(userId: string, itemId: string) {
    return artisansService.removePortfolioItem(userId, itemId);
  },

  async updateStudentVerification(
    userId: string,
    input: StudentVerificationInput,
    file?: any
  ) {
    const profile = await artisanProfileRepository.findByUserId(userId);
    if (!profile) throw ApiError.notFound('Artisan profile not found.');

    let imageUrl: string | undefined;
    if (file) {
      try {
        imageUrl = await uploadToCloudinary(file.buffer, 'verifications');
      } catch (error) {
        console.error('Cloudinary upload failed (verification):', error);
        throw ApiError.internal('Failed to upload verification image.');
      }
    } else {
      imageUrl = profile.verification?.verificationImageUrl ?? undefined;
    }

    if (!imageUrl) {
      throw ApiError.badRequest('A verification image is required.');
    }

    await artisanVerificationRepository.upsert(profile.id, {
      institution: input.institution,
      studentIdNumber: input.studentIdNumber,
      verificationImageUrl: imageUrl,
    });

    return this.getStatus(userId);
  },

  async submit(userId: string) {
    const profile = (await artisanProfileRepository.findByUserId(userId)) as unknown as LoadedProfile | null;
    if (!profile) throw ApiError.notFound('Artisan profile not found.');

    const status = computeStatus(profile);
    if (!status.canSubmit) {
      throw ApiError.badRequest('Application is incomplete. Complete all required steps before submitting.', {
        missing: status.missing,
      });
    }

    const updated = await artisansService.setApplicationStatus(
      profile.id,
      ApplicationStatus.PENDING_REVIEW,
      'Application submitted for review.',
      userId
    );

    return {
      ...status,
      applicationStatus: ApplicationStatus.PENDING_REVIEW,
      submittedAt: new Date().toISOString(),
    };
  },
};
