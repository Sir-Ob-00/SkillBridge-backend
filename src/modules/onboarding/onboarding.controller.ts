import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { onboardingService } from './onboarding.service';
import { artisansService } from '../../mobile/artisans/artisans.service';
import {
  PersonalInput,
  BusinessInput,
  SkillsInput,
  ServicesInput,
  AvailabilityInput,
  StudentVerificationInput,
  PortfolioMetadataInput,
} from './onboarding.validators';

export const onboardingController = {
  getStatus: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const status = await onboardingService.getStatus(req.user.id);
    return sendSuccess(res, status);
  }),

  updatePersonal: asyncHandler(
    async (req: Request<unknown, unknown, PersonalInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const status = await onboardingService.updatePersonal(req.user.id, req.body);
      return sendSuccess(res, status, 'Personal information updated.');
    }
  ),

  updateBusiness: asyncHandler(
    async (req: Request<unknown, unknown, BusinessInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const status = await onboardingService.updateBusiness(req.user.id, req.body);
      return sendSuccess(res, status, 'Business information updated.');
    }
  ),

  updateSkills: asyncHandler(async (req: Request<unknown, unknown, SkillsInput>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const status = await onboardingService.updateSkills(req.user.id, req.body);
    return sendSuccess(res, status, 'Skills updated.');
  }),

  updateServices: asyncHandler(
    async (req: Request<unknown, unknown, ServicesInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const status = await onboardingService.updateServices(req.user.id, req.body);
      return sendSuccess(res, status, 'Services updated.');
    }
  ),

  updateAvailability: asyncHandler(
    async (req: Request<unknown, unknown, AvailabilityInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const status = await onboardingService.updateAvailability(req.user.id, req.body);
      return sendSuccess(res, status, 'Availability updated.');
    }
  ),

  listPortfolio: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const profile = await onboardingService.getStatus(req.user.id);
    const items = await artisansService.listPortfolio(profile.artisanId);
    return sendSuccess(res, items);
  }),

  addPortfolioItem: asyncHandler(
    async (req: Request<unknown, unknown, { title: string; description?: string }>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const item = await onboardingService.addPortfolioItem(req.user.id, req.body, (req as any).file);
      return sendSuccess(res, item, 'Portfolio image added.', 201);
    }
  ),

  updatePortfolio: asyncHandler(
    async (req: Request<unknown, unknown, PortfolioMetadataInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const status = await onboardingService.updatePortfolioMetadata(req.user.id, req.body.items);
      return sendSuccess(res, status, 'Portfolio updated.');
    }
  ),

  removePortfolioItem: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await onboardingService.removePortfolioItem(req.user.id, req.params.id);
    return sendSuccess(res, null, result.message);
  }),

  updateStudentVerification: asyncHandler(
    async (req: Request<unknown, unknown, StudentVerificationInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const status = await onboardingService.updateStudentVerification(
        req.user.id,
        req.body,
        (req as any).file
      );
      return sendSuccess(res, status, 'Student verification updated.');
    }
  ),

  submit: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await onboardingService.submit(req.user.id);
    return sendSuccess(res, result, 'Application submitted for review.', 201);
  }),
};
