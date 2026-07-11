import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminAnalyticsService } from './admin.analytics.service';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export { analyticsQuerySchema };

export const adminAnalyticsController = {
  getAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const query = analyticsQuerySchema.parse(req.query);
    const data = await adminAnalyticsService.getAnalytics(query);
    return sendSuccess(res, data);
  }),

  overview: asyncHandler(async (req: Request, res: Response) => {
    const query = analyticsQuerySchema.parse(req.query);
    const data = await adminAnalyticsService.overview(query);
    return sendSuccess(res, data);
  }),

  users: asyncHandler(async (req: Request, res: Response) => {
    const query = analyticsQuerySchema.parse(req.query);
    const data = await adminAnalyticsService.users(query);
    return sendSuccess(res, data);
  }),

  bookings: asyncHandler(async (req: Request, res: Response) => {
    const query = analyticsQuerySchema.parse(req.query);
    const data = await adminAnalyticsService.bookings(query);
    return sendSuccess(res, data);
  }),

  reviews: asyncHandler(async (req: Request, res: Response) => {
    const query = analyticsQuerySchema.parse(req.query);
    const data = await adminAnalyticsService.reviews(query);
    return sendSuccess(res, data);
  }),

  reports: asyncHandler(async (req: Request, res: Response) => {
    const query = analyticsQuerySchema.parse(req.query);
    const data = await adminAnalyticsService.reports(query);
    return sendSuccess(res, data);
  }),

  categories: asyncHandler(async (req: Request, res: Response) => {
    const query = analyticsQuerySchema.parse(req.query);
    const data = await adminAnalyticsService.categories(query);
    return sendSuccess(res, data);
  }),

  revenue: asyncHandler(async (req: Request, res: Response) => {
    const query = analyticsQuerySchema.parse(req.query);
    const data = await adminAnalyticsService.revenue(query);
    return sendSuccess(res, data);
  }),
};
