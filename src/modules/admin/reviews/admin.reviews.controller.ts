import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminReviewsService } from './admin.reviews.service';
import { ReviewIdParam } from '../../reviews/reviews.validators';

export const adminReviewsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const reviews = await adminReviewsService.list();
    return sendSuccess(res, reviews);
  }),

  remove: asyncHandler(async (req: Request<ReviewIdParam>, res: Response) => {
    const result = await adminReviewsService.remove(req.params.id);
    return sendSuccess(res, null, result.message);
  }),
};
