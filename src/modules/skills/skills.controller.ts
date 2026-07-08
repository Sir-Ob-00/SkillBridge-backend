import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { skillsService } from './skills.service';

export const skillsController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const skills = await skillsService.list();
    return sendSuccess(res, skills);
  }),
};
