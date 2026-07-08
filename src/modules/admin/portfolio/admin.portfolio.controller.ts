import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminPortfolioService } from './admin.portfolio.service';
import { PortfolioItemIdParam } from './admin.portfolio.validators';

export const adminPortfolioController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const items = await adminPortfolioService.list();
    return sendSuccess(res, items);
  }),

  remove: asyncHandler(async (req: Request<PortfolioItemIdParam>, res: Response) => {
    const result = await adminPortfolioService.remove(req.params.id);
    return sendSuccess(res, null, result.message);
  }),
};
