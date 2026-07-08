import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminCategoriesService } from './admin.categories.service';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesQuery,
  CategoryIdParam,
} from '../../categories/categories.validators';

export const adminCategoriesController = {
  list: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListCategoriesQuery>, res: Response) => {
      const categories = await adminCategoriesService.list(req.query);
      return sendSuccess(res, categories);
    }
  ),

  create: asyncHandler(
    async (req: Request<unknown, unknown, CreateCategoryInput>, res: Response) => {
      const category = await adminCategoriesService.create(req.body);
      return sendSuccess(res, category, 'Category created.', 201);
    }
  ),

  update: asyncHandler(
    async (req: Request<CategoryIdParam, unknown, UpdateCategoryInput>, res: Response) => {
      const category = await adminCategoriesService.update(req.params.id, req.body);
      return sendSuccess(res, category, 'Category updated.');
    }
  ),

  remove: asyncHandler(async (req: Request<CategoryIdParam>, res: Response) => {
    const result = await adminCategoriesService.remove(req.params.id);
    return sendSuccess(res, null, result.message);
  }),
};
