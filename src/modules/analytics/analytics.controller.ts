import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { analyticsService } from './analytics.service';
import { BookingTrendsQuery } from './analytics.validators';

export const analyticsController = {
  overview: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.getOverview();
    return sendSuccess(res, data);
  }),

  bookingTrends: asyncHandler(
    async (req: Request<unknown, unknown, unknown, BookingTrendsQuery>, res: Response) => {
      const data = await analyticsService.getBookingTrends(req.query);
      return sendSuccess(res, data);
    }
  ),

  topCategories: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.getTopCategories();
    return sendSuccess(res, data);
  }),

  averageRatings: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.getAverageRatings();
    return sendSuccess(res, data);
  }),
};
