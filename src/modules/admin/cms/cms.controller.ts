import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';
import { cmsService } from './cms.service';

export const cmsIdParamSchema = z.object({ id: z.string().uuid() });
export const listCmsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CmsIdParam = z.infer<typeof cmsIdParamSchema>;
export type ListCmsQuery = z.infer<typeof listCmsQuerySchema>;

export const cmsController = {
  list: asyncHandler(async (req: any, res: Response) => {
    const { items, meta } = await cmsService.list(req.query);
    return sendPaginated(res, items, meta);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await cmsService.create(req.body);
    return sendSuccess(res, item, 'Content created.', 201);
  }),

  update: asyncHandler(async (req: any, res: Response) => {
    const item = await cmsService.update(req.params.id, req.body);
    return sendSuccess(res, item, 'Content updated.');
  }),

  remove: asyncHandler(async (req: any, res: Response) => {
    await cmsService.remove(req.params.id);
    return sendSuccess(res, null, 'Content deleted.');
  }),
};
