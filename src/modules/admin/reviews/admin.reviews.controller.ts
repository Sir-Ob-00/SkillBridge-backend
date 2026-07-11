import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminReviewsService } from './admin.reviews.service';
import {
  listReviewsQuerySchema,
  reviewIdParamSchema,
} from '../../reviews/reviews.validators';
import { validate } from '../../../middlewares/validate';
import { recordAudit, getClientIp } from '../../../utils/audit';
import type { ListReviewsQuery } from '../../reviews/reviews.validators';

export const adminReviewsController = {
  list: [
    validate(listReviewsQuerySchema, 'query'),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminReviewsService.list(req.query as unknown as ListReviewsQuery);
      return sendSuccess(res, result);
    }),
  ],

  statistics: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminReviewsService.statistics();
    return sendSuccess(res, stats);
  }),

  export: asyncHandler(async (_req: Request, res: Response) => {
    const rows = await adminReviewsService.export();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="reviews.json"');
    return res.status(200).json({ success: true, data: rows });
  }),

  getById: [
    validate(reviewIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const review = await adminReviewsService.getById(req.params.id);
      return sendSuccess(res, review);
    }),
  ],

  hide: [
    validate(reviewIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const review = await adminReviewsService.hide(req.params.id);
      await recordAudit({
        adminId: req.user.id,
        action: 'HIDE',
        resource: 'review',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, review, 'Review hidden.');
    }),
  ],

  restore: [
    validate(reviewIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const review = await adminReviewsService.restore(req.params.id);
      await recordAudit({
        adminId: req.user.id,
        action: 'RESTORE',
        resource: 'review',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, review, 'Review restored.');
    }),
  ],

  flag: [
    validate(reviewIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const review = await adminReviewsService.flag(req.params.id);
      await recordAudit({
        adminId: req.user.id,
        action: 'FLAG',
        resource: 'review',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, review, 'Review flagged.');
    }),
  ],

  remove: [
    validate(reviewIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const result = await adminReviewsService.remove(req.params.id);
      await recordAudit({
        adminId: req.user.id,
        action: 'DELETE',
        resource: 'review',
        resourceId: req.params.id,
        ipAddress: getClientIp(req),
      });
      return sendSuccess(res, null, result.message);
    }),
  ],
};
