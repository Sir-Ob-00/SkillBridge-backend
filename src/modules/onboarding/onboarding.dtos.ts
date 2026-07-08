import { ApplicationStatus, VerificationReviewStatus } from '@prisma/client';

export interface OnboardingStatusDto {
  artisanId: string;
  applicationStatus: ApplicationStatus;
  verification: {
    reviewStatus: VerificationReviewStatus;
    institution?: string;
    studentIdNumber?: string;
    hasImage: boolean;
  } | null;
  steps: {
    personal: boolean;
    business: boolean;
    skills: boolean;
    services: boolean;
    availability: boolean;
    portfolio: boolean;
    studentVerification: boolean;
  };
  canSubmit: boolean;
  missing: string[];
}
