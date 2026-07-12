import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { categoriesService } from './categories.service';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesQuery,
  CategoryIdParam,
} from './categories.validators';

export const categoriesController = {
  list: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListCategoriesQuery>, res: Response) => {
      const categories = await categoriesService.list(req.query);
      return sendSuccess(res, categories);
    }
  ),

  create: asyncHandler(async (req: Request<unknown, unknown, CreateCategoryInput>, res: Response) => {
    const category = await categoriesService.create(req.body);
    return sendSuccess(res, category, 'Category created.', 201);
  }),

  update: asyncHandler(
    async (req: Request<CategoryIdParam, unknown, UpdateCategoryInput>, res: Response) => {
      const category = await categoriesService.update(req.params.id, req.body);
      return sendSuccess(res, category, 'Category updated.');
    }
  ),

  remove: asyncHandler(async (req: Request<CategoryIdParam>, res: Response) => {
    const result = await categoriesService.remove(req.params.id);
    return sendSuccess(res, null, result.message);
  }),

  listSkills: asyncHandler(async (req: Request<CategoryIdParam>, res: Response) => {
    const skills = await categoriesService.getSkills(req.params.id);
    return sendSuccess(res, skills);
  }),
};
