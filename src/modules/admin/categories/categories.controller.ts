import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';
import { categoriesService } from './categories.service';

export const categoryIdParamSchema = z.object({ id: z.string().uuid() });
export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;

export const categoriesController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const categories = await categoriesService.list();
    return sendSuccess(res, categories);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoriesService.create({ name: req.body.name, active: req.body.active });
    return sendSuccess(res, category, 'Category created.');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoriesService.update(req.params.id, req.body);
    return sendSuccess(res, category, 'Category updated.');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await categoriesService.remove(req.params.id);
    return sendSuccess(res, null, 'Category deleted.');
  }),
};
