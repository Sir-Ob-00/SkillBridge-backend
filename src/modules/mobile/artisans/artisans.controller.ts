import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { artisansService } from './artisans.service';
import { reviewsService } from '../../reviews/reviews.service';
import { ListReviewsQuery } from '../../reviews/reviews.validators';
import {
  UpsertArtisanProfileInput,
  AddPortfolioItemInput,
  ListArtisansQuery,
  ArtisanIdParam,
  PortfolioItemParam,
  CreateServiceInput,
  UpdateServiceInput,
  ServiceIdParam,
  ApproveArtisanInput,
  RejectArtisanInput,
  RequestChangesInput,
} from './artisans.validators';

export const artisansController = {
  getMyProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const profile = await artisansService.getProfileByUserId(req.user.id);
    return sendSuccess(res, profile);
  }),

  upsertMyProfile: asyncHandler(
    async (req: Request<unknown, unknown, UpsertArtisanProfileInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const profile = await artisansService.upsertProfile(req.user.id, req.body);
      return sendSuccess(res, profile, 'Artisan profile updated.');
    }
  ),

  getById: asyncHandler(async (req: Request<ArtisanIdParam>, res: Response) => {
    const profile = await artisansService.getById(req.params.id);
    return sendSuccess(res, profile);
  }),

  list: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListArtisansQuery>, res: Response) => {
      const { items, meta } = await artisansService.list(req.query);
      return sendPaginated(res, items, meta);
    }
  ),

  addPortfolioItem: asyncHandler(
    async (req: Request<unknown, unknown, AddPortfolioItemInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const item = await artisansService.addPortfolioItem(req.user.id, req.body);
      return sendSuccess(res, item, 'Portfolio item added.', 201);
    }
  ),

  removePortfolioItem: asyncHandler(async (req: Request<PortfolioItemParam>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await artisansService.removePortfolioItem(req.user.id, req.params.itemId);
    return sendSuccess(res, null, result.message);
  }),

  listServices: asyncHandler(async (req: Request<ArtisanIdParam>, res: Response) => {
    const services = await artisansService.listServices(req.params.id);
    return sendSuccess(res, services);
  }),

  createService: asyncHandler(
    async (req: Request<ArtisanIdParam, unknown, CreateServiceInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const service = await artisansService.createService(req.user.id, req.body);
      return sendSuccess(res, service, 'Service created.', 201);
    }
  ),

  updateService: asyncHandler(
    async (req: Request<ServiceIdParam, unknown, UpdateServiceInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const service = await artisansService.updateService(req.user.id, req.params.serviceId, req.body);
      return sendSuccess(res, service, 'Service updated.');
    }
  ),

  deleteService: asyncHandler(async (req: Request<ServiceIdParam>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await artisansService.deleteService(req.user.id, req.params.serviceId);
    return sendSuccess(res, null, result.message);
  }),

  getAvailability: asyncHandler(async (req: Request<ArtisanIdParam>, res: Response) => {
    const availability = await artisansService.getAvailability(req.params.id);
    return sendSuccess(res, availability);
  }),

  listReviews: asyncHandler(
    async (req: Request<ArtisanIdParam, unknown, unknown, ListReviewsQuery>, res: Response) => {
      const { items, meta } = await reviewsService.listForArtisan(req.params.id, req.query);
      return sendPaginated(res, items, meta);
    }
  ),

  updateAvailability: asyncHandler(
    async (req: Request<ArtisanIdParam, unknown, any>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const availability = await artisansService.updateAvailability(req.user.id, req.body.availability);
      return sendSuccess(res, availability, 'Availability updated.');
    }
  ),

  verify: asyncHandler(async (req: Request<ArtisanIdParam>, res: Response) => {
    const profile = await artisansService.setVerification(req.params.id, 'verified');
    return sendSuccess(res, profile, 'Artisan verified.');
  }),

  reject: asyncHandler(async (req: Request<ArtisanIdParam>, res: Response) => {
    const profile = await artisansService.setVerification(req.params.id, 'rejected');
    return sendSuccess(res, profile, 'Artisan rejected.');
  }),

  suspend: asyncHandler(async (req: Request<ArtisanIdParam>, res: Response) => {
    const profile = await artisansService.setSuspended(req.params.id, true);
    return sendSuccess(res, profile, 'Artisan suspended.');
  }),

  unsuspend: asyncHandler(async (req: Request<ArtisanIdParam>, res: Response) => {
    const profile = await artisansService.setSuspended(req.params.id, false);
    return sendSuccess(res, profile, 'Artisan reinstated.');
  }),

  approve: asyncHandler(async (req: Request<ArtisanIdParam, unknown, ApproveArtisanInput>, res: Response) => {
    const profile = await artisansService.approveArtisan(req.params.id, req.user!.id, req.body.notes);
    return sendSuccess(res, profile, 'Artisan application approved.');
  }),

  rejectApplication: asyncHandler(async (req: Request<ArtisanIdParam, unknown, RejectArtisanInput>, res: Response) => {
    const profile = await artisansService.rejectArtisan(req.params.id, req.user!.id, req.body.reason);
    return sendSuccess(res, profile, 'Artisan application rejected.');
  }),

  requestChanges: asyncHandler(async (req: Request<ArtisanIdParam, unknown, RequestChangesInput>, res: Response) => {
    const profile = await artisansService.requestChangesArtisan(req.params.id, req.user!.id, req.body.changes);
    return sendSuccess(res, profile, 'Changes requested from artisan.');
  }),
};
