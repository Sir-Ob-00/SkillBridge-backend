import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { settingsService } from './settings.service';

export const settingsController = {
  get: asyncHandler(async (_req: Request, res: Response) => {
    const settings = await settingsService.get();
    return sendSuccess(res, settings);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsService.update(req.body);
    return sendSuccess(res, settings, 'Settings updated.');
  }),
};
