import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';
import { portfolioService } from './portfolio.service';

export const portfolioIdParamSchema = z.object({ id: z.string().uuid() });
export const listPortfoliosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  artisanId: z.string().uuid().optional(),
});

export type PortfolioIdParam = z.infer<typeof portfolioIdParamSchema>;
export type ListPortfoliosQuery = z.infer<typeof listPortfoliosQuerySchema>;

export const portfolioController = {
  list: asyncHandler(async (req: any, res: Response) => {
    const { items, meta } = await portfolioService.list(req.query);
    return sendPaginated(res, items, meta);
  }),

  remove: asyncHandler(async (req: any, res: Response) => {
    await portfolioService.remove(req.params.id);
    return sendSuccess(res, null, 'Portfolio item deleted.');
  }),
};
