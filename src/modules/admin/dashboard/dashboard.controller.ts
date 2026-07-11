import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await dashboardService.getStats();
    return sendSuccess(res, stats);
  }),

  overview: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.overview();
    return sendSuccess(res, data);
  }),

  statistics: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.statistics();
    return sendSuccess(res, data);
  }),

  recentActivities: asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 15, 50);
    const data = await dashboardService.recentActivities(limit);
    return sendSuccess(res, data);
  }),

  recentBookings: asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const data = await dashboardService.recentBookings(limit);
    return sendSuccess(res, data);
  }),

  recentReviews: asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const data = await dashboardService.recentReviews(limit);
    return sendSuccess(res, data);
  }),

  recentReports: asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const data = await dashboardService.recentReports(limit);
    return sendSuccess(res, data);
  }),
};
