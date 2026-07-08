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
  UpdateAvailabilityInput,
} from './artisans.validators';
import { imageUpload } from './upload';

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

  getPortfolio: asyncHandler(async (req: Request<ArtisanIdParam>, res: Response) => {
    const items = await artisansService.listPortfolio(req.params.id);
    return sendSuccess(res, items);
  }),

  updateProfileImage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const profile = await artisansService.updateProfileImage(req.user.id, (req as any).file);
    return sendSuccess(res, profile, 'Profile image updated.');
  }),

  addPortfolioItem: asyncHandler(async (req: Request<unknown, unknown, AddPortfolioItemInput>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const item = await artisansService.addPortfolioItem(req.user.id, req.body, (req as any).file);
    return sendSuccess(res, item, 'Portfolio item added.', 201);
  }),

  removePortfolioItem: asyncHandler(async (req: Request<PortfolioItemParam>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await artisansService.removePortfolioItem(req.user.id, req.params.itemId);
    return sendSuccess(res, null, result.message);
  }),

  // ── Services ──────────────────────────────────────────────────────

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

  // ── Availability ──────────────────────────────────────────────────

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
    async (req: Request<ArtisanIdParam, unknown, UpdateAvailabilityInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const availability = await artisansService.updateAvailability(req.user.id, req.body.slots);
      return sendSuccess(res, availability, 'Availability updated.');
    }
  ),

  // ── Admin moderation ──────────────────────────────────────────────

  verify: asyncHandler(async (req: Request<ArtisanIdParam, unknown, { note?: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const profile = await artisansService.approve(req.params.id, req.body?.note, req.user.id);
    return sendSuccess(res, profile, 'Artisan approved.');
  }),

  reject: asyncHandler(async (req: Request<ArtisanIdParam, unknown, { note?: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const profile = await artisansService.reject(req.params.id, req.body?.note ?? 'Rejected by admin', req.user.id);
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
};
