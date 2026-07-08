import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminSettingsService } from './admin.settings.service';
import { UpdateSettingsInput } from './admin.settings.validators';

export const adminSettingsController = {
  getSettings: asyncHandler(async (_req: Request, res: Response) => {
    const settings = await adminSettingsService.getSettings();
    return sendSuccess(res, settings);
  }),

  updateSettings: asyncHandler(
    async (req: Request<unknown, unknown, UpdateSettingsInput>, res: Response) => {
      const settings = await adminSettingsService.updateSettings(req.body);
      return sendSuccess(res, settings, 'Settings updated.');
    }
  ),
};
