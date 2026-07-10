import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { verificationService } from './verification.service';

export const verificationController = {
  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await verificationService.getStats();
    return sendSuccess(res, stats);
  }),
};
