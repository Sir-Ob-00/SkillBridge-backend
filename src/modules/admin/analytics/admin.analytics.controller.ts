import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminAnalyticsService } from './admin.analytics.service';

export const adminAnalyticsController = {
  getAnalytics: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminAnalyticsService.getAnalytics();
    return sendSuccess(res, data);
  }),
};
