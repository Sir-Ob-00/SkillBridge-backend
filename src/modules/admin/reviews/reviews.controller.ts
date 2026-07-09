import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';
import { reviewsService } from './reviews.service';

export const reviewIdParamSchema = z.object({ id: z.string().uuid() });
export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReviewIdParam = z.infer<typeof reviewIdParamSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;

export const reviewsController = {
  list: asyncHandler(async (req: any, res: Response) => {
    const { items, meta } = await reviewsService.list(req.query);
    return sendPaginated(res, items, meta);
  }),

  delete: asyncHandler(async (req: any, res: Response) => {
    await reviewsService.remove(req.params.id);
    return sendSuccess(res, null, 'Review deleted.');
  }),

  flag: asyncHandler(async (req: any, res: Response) => {
    const review = await reviewsService.flag(req.params.id);
    return sendSuccess(res, review, 'Review flagged.');
  }),
};
