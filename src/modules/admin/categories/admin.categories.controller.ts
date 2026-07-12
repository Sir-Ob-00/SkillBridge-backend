import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminCategoriesService } from './admin.categories.service';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from '../../categories/categories.validators';
import { categoryStatusSchema, reorderCategoriesSchema } from './admin.categories.validators';
import { validate } from '../../../middlewares/validate';
import { recordAudit, getClientIp } from '../../../utils/audit';

export const adminCategoriesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const categories = await adminCategoriesService.list(req.query as any);
    return sendSuccess(res, categories);
  }),

  statistics: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminCategoriesService.statistics();
    return sendSuccess(res, stats);
  }),

  getById: [
    validate(categoryIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const category = await adminCategoriesService.getById(req.params.id);
      return sendSuccess(res, category);
    }),
  ],

  create: [
    validate(createCategorySchema),
    asyncHandler(async (req: Request, res: Response) => {
      const category = await adminCategoriesService.create(req.body);
      await recordAudit({ adminId: req.user?.id, action: 'CREATE', resource: 'category', resourceId: category.id, ipAddress: getClientIp(req), newValue: req.body });
      return sendSuccess(res, category, 'Category created.', 201);
    }),
  ],

  update: [
    validate(categoryIdParamSchema, 'params'),
    validate(updateCategorySchema),
    asyncHandler(async (req: Request, res: Response) => {
      const category = await adminCategoriesService.update(req.params.id, req.body);
      await recordAudit({ adminId: req.user?.id, action: 'UPDATE', resource: 'category', resourceId: req.params.id, ipAddress: getClientIp(req), newValue: req.body });
      return sendSuccess(res, category, 'Category updated.');
    }),
  ],

  setStatus: [
    validate(categoryIdParamSchema, 'params'),
    validate(categoryStatusSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const category = await adminCategoriesService.setStatus(req.params.id, req.body);
      await recordAudit({ adminId: req.user?.id, action: 'UPDATE_STATUS', resource: 'category', resourceId: req.params.id, ipAddress: getClientIp(req), newValue: req.body });
      return sendSuccess(res, category, 'Category status updated.');
    }),
  ],

  reorder: [
    validate(reorderCategoriesSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminCategoriesService.reorder(req.body);
      await recordAudit({ adminId: req.user?.id, action: 'REORDER', resource: 'category', ipAddress: getClientIp(req), newValue: req.body });
      return sendSuccess(res, result, 'Categories reordered.');
    }),
  ],

  remove: [
    validate(categoryIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminCategoriesService.remove(req.params.id);
      await recordAudit({ adminId: req.user?.id, action: 'DELETE', resource: 'category', ipAddress: getClientIp(req) });
      return sendSuccess(res, null, result.message);
    }),
  ],
};
