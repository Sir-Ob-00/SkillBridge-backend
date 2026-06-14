import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { reviewsService } from './reviews.service';
import {
  CreateReviewInput,
  ListReviewsQuery,
  ArtisanIdParam,
  ReviewIdParam,
} from './reviews.validators';

export const reviewsController = {
  create: asyncHandler(async (req: Request<unknown, unknown, CreateReviewInput>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const review = await reviewsService.create(req.user.id, req.body);
    return sendSuccess(res, review, 'Review submitted.', 201);
  }),

  listForArtisan: asyncHandler(
    async (req: Request<ArtisanIdParam, unknown, unknown, ListReviewsQuery>, res: Response) => {
      const { items, meta } = await reviewsService.listForArtisan(req.params.artisanId, req.query);
      return sendPaginated(res, items, meta);
    }
  ),

  remove: asyncHandler(async (req: Request<ReviewIdParam>, res: Response) => {
    const result = await reviewsService.delete(req.params.id);
    return sendSuccess(res, null, result.message);
  }),

  flag: asyncHandler(async (req: Request<ReviewIdParam>, res: Response) => {
    const review = await reviewsService.flag(req.params.id);
    return sendSuccess(res, review, 'Review flagged for moderation.');
  }),
};
