import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { onboardingService } from './onboarding.service';
import {
  personalSchema,
  businessSchema,
  skillsSchema,
  servicesSchema,
  availabilitySchema,
  portfolioSchema,
  verificationSchema,
  submitSchema,
} from './onboarding.validators';

type RequestBody<T> = Request<unknown, unknown, T>;

export const onboardingController = {
  getStatus: asyncHandler(async (req: Request, res: Response) => {
    const status = await onboardingService.getOnboardingStatus(req.user!.id);
    return sendSuccess(res, status);
  }),

  updatePersonal: asyncHandler(
    async (req: RequestBody<typeof personalSchema._type>, res: Response) => {
      const user = await onboardingService.updatePersonal(req.user!.id, req.body);
      return sendSuccess(res, user, 'Personal information updated.');
    }
  ),

  updateBusiness: asyncHandler(
    async (req: RequestBody<typeof businessSchema._type>, res: Response) => {
      const profile = await onboardingService.updateBusiness(req.user!.id, req.body);
      return sendSuccess(res, profile, 'Business information updated.');
    }
  ),

  updateSkills: asyncHandler(
    async (req: RequestBody<typeof skillsSchema._type>, res: Response) => {
      const skills = await onboardingService.updateSkills(req.user!.id, req.body);
      return sendSuccess(res, skills, 'Skills updated.');
    }
  ),

  updateServices: asyncHandler(
    async (req: RequestBody<typeof servicesSchema._type>, res: Response) => {
      const services = await onboardingService.updateServices(req.user!.id, req.body);
      return sendSuccess(res, services, 'Services updated.');
    }
  ),

  updateAvailability: asyncHandler(
    async (req: RequestBody<typeof availabilitySchema._type>, res: Response) => {
      const slots = await onboardingService.updateAvailability(req.user!.id, req.body);
      return sendSuccess(res, slots, 'Availability updated.');
    }
  ),

  updatePortfolio: asyncHandler(
    async (req: RequestBody<typeof portfolioSchema._type>, res: Response) => {
      const items = await onboardingService.updatePortfolio(req.user!.id, req.body);
      return sendSuccess(res, items, 'Portfolio updated.');
    }
  ),

  updateVerification: asyncHandler(
    async (req: RequestBody<typeof verificationSchema._type>, res: Response) => {
      const verification = await onboardingService.updateVerification(req.user!.id, req.body);
      return sendSuccess(res, verification, 'Verification information updated.');
    }
  ),

  submitApplication: asyncHandler(
    async (req: RequestBody<typeof submitSchema._type>, res: Response) => {
      const result = await onboardingService.submitApplication(req.user!.id, req.body);
      return sendSuccess(res, result, 'Application submitted successfully.');
    }
  ),
};
