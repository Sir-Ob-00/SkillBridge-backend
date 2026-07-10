import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { applicationsService } from './applications.service';
import {
  ListApplicationsQuery,
  ApplicationIdParam,
  ApproveApplicationInput,
  RejectApplicationInput,
  RequestChangesInput,
} from './applications.validators';

export const applicationsController = {
  list: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListApplicationsQuery>, res: Response) => {
      const { items, meta } = await applicationsService.list({
        status: req.query.status,
        page: req.query.page,
        pageSize: req.query.pageSize,
      });
      return sendPaginated(res, items, meta);
    }
  ),

  getById: asyncHandler(async (req: Request<ApplicationIdParam>, res: Response) => {
    const application = await applicationsService.getById(req.params.id);
    return sendSuccess(res, application);
  }),

  approve: asyncHandler(
    async (req: Request<ApplicationIdParam, unknown, ApproveApplicationInput>, res: Response) => {
      if (!req.user) throw new Error('Unauthorized');
      const result = await applicationsService.approve(req.params.id, req.user.id, req.body.notes ?? undefined);
      return sendSuccess(res, result, 'Application approved.');
    }
  ),

  reject: asyncHandler(
    async (req: Request<ApplicationIdParam, unknown, RejectApplicationInput>, res: Response) => {
      if (!req.user) throw new Error('Unauthorized');
      const result = await applicationsService.reject(req.params.id, req.user.id, req.body.reason);
      return sendSuccess(res, result, 'Application rejected.');
    }
  ),

  requestChanges: asyncHandler(
    async (req: Request<ApplicationIdParam, unknown, RequestChangesInput>, res: Response) => {
      if (!req.user) throw new Error('Unauthorized');
      const result = await applicationsService.requestChanges(req.params.id, req.user.id, req.body.notes);
      return sendSuccess(res, result, 'Changes requested.');
    }
  ),
};
