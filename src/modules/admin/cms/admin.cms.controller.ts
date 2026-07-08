import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminCmsService } from './admin.cms.service';
import {
  CreateContentInput,
  UpdateContentInput,
  ContentIdParam,
} from './admin.cms.validators';

export const adminCmsController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const items = await adminCmsService.list();
    return sendSuccess(res, items);
  }),

  create: asyncHandler(async (req: Request<unknown, unknown, CreateContentInput>, res: Response) => {
    const item = await adminCmsService.create(req.body);
    return sendSuccess(res, item, 'Content created.', 201);
  }),

  update: asyncHandler(
    async (req: Request<ContentIdParam, unknown, UpdateContentInput>, res: Response) => {
      const item = await adminCmsService.update(req.params.id, req.body);
      return sendSuccess(res, item, 'Content updated.');
    }
  ),

  remove: asyncHandler(async (req: Request<ContentIdParam>, res: Response) => {
    const result = await adminCmsService.remove(req.params.id);
    return sendSuccess(res, null, result.message);
  }),
};
