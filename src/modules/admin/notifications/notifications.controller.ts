import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { notificationsService } from './notifications.service';

export const notificationsController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const notifications = await notificationsService.list();
    return sendSuccess(res, notifications);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationsService.create(req.body);
    return sendSuccess(res, notification, 'Notification sent.', 201);
  }),
};
