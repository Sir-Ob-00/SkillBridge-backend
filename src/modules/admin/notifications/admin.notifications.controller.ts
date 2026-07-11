import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminNotificationsService } from './admin.notifications.service';
import {
  createNotificationSchema,
  broadcastNotificationSchema,
  markReadSchema,
} from './admin.notifications.validators';
import { validate } from '../../../middlewares/validate';

export const adminNotificationsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const page = Number(req.query.page) || 1;
    const pageSize = Math.min(Number(req.query.pageSize) || 20, 100);
    const result = await adminNotificationsService.list({
      targetUserId: req.user.id,
      targetRole: req.user.role,
      page,
      pageSize,
    });
    return sendSuccess(res, result);
  }),

  statistics: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminNotificationsService.statistics();
    return sendSuccess(res, stats);
  }),

  create: [
    validate(createNotificationSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const notification = await adminNotificationsService.create(req.user.id, req.body);
      return sendSuccess(res, notification, 'Notification sent.', 201);
    }),
  ],

  broadcast: [
    validate(broadcastNotificationSchema),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const notifications = await adminNotificationsService.broadcast(req.user.id, req.body);
      return sendSuccess(res, notifications, 'Notification broadcast sent.', 201);
    }),
  ],

  markRead: [
    validate(markReadSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const notification = await adminNotificationsService.markRead(req.params.id, req.body.read);
      return sendSuccess(res, notification, 'Notification updated.');
    }),
  ],

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminNotificationsService.remove(req.params.id);
    return sendSuccess(res, result, result.message);
  }),
};
