import { Router } from 'express';
import { adminSkillsController } from './admin.skills.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  listSkillsQuerySchema,
  createSkillSchema,
  updateSkillSchema,
  skillIdParamSchema,
} from './admin.skills.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', validate(listSkillsQuerySchema, 'query'), adminSkillsController.list as any);
router.get('/:id', validate(skillIdParamSchema, 'params'), adminSkillsController.getById as any);
router.post('/', validate(createSkillSchema), adminSkillsController.create as any);
router.patch('/:id', validate(skillIdParamSchema, 'params'), validate(updateSkillSchema), adminSkillsController.update as any);
router.delete('/:id', validate(skillIdParamSchema, 'params'), adminSkillsController.remove as any);

export const adminSkillsRouter = router;
