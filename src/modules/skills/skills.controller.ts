import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { skillsService } from './skills.service';

export const skillsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
    const skills = await skillsService.list({ categoryId });
    return sendSuccess(res, skills);
  }),
};
