import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminSkillsService } from './admin.skills.service';
import {
  createSkillSchema,
  updateSkillSchema,
  skillIdParamSchema,
} from './admin.skills.validators';
import { validate } from '../../../middlewares/validate';
import { recordAudit, getClientIp } from '../../../utils/audit';

export const adminSkillsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const skills = await adminSkillsService.list(req.query as any);
    return sendSuccess(res, skills);
  }),

  getById: [
    validate(skillIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const skill = await adminSkillsService.getById(req.params.id);
      return sendSuccess(res, skill);
    }),
  ],

  create: [
    validate(createSkillSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const skill = await adminSkillsService.create(req.body);
      await recordAudit({ adminId: req.user?.id, action: 'CREATE', resource: 'skill', resourceId: skill.id, ipAddress: getClientIp(req), newValue: req.body });
      return sendSuccess(res, skill, 'Skill created.', 201);
    }),
  ],

  update: [
    validate(skillIdParamSchema, 'params'),
    validate(updateSkillSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const skill = await adminSkillsService.update(req.params.id, req.body);
      await recordAudit({ adminId: req.user?.id, action: 'UPDATE', resource: 'skill', resourceId: req.params.id, ipAddress: getClientIp(req), newValue: req.body });
      return sendSuccess(res, skill, 'Skill updated.');
    }),
  ],

  remove: [
    validate(skillIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminSkillsService.remove(req.params.id);
      await recordAudit({ adminId: req.user?.id, action: 'DELETE', resource: 'skill', resourceId: req.params.id, ipAddress: getClientIp(req) });
      return sendSuccess(res, null, result.message);
    }),
  ],
};
