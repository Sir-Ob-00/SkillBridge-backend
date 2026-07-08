import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  getDashboard: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.getDashboard();
    return sendSuccess(res, data);
  }),
};
