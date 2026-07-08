import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { adminNotificationsService } from './admin.notifications.service';
import { CreateNotificationInput } from './admin.notifications.validators';

export const adminNotificationsController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const notifications = await adminNotificationsService.list();
    return sendSuccess(res, notifications);
  }),

  create: asyncHandler(
    async (req: Request<unknown, unknown, CreateNotificationInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const notification = await adminNotificationsService.create(req.user.id, req.body);
      return sendSuccess(res, notification, 'Notification sent.', 201);
    }
  ),
};
