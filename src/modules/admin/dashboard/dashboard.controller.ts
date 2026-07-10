import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const stats = await dashboardService.getStats();
    return sendSuccess(res, stats);
  }),
};
