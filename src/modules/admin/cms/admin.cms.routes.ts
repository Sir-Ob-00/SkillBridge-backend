import { Router } from 'express';
import { adminCmsController } from './admin.cms.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  createContentSchema,
  updateContentSchema,
  contentIdParamSchema,
} from './admin.cms.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminCmsController.list);
router.post('/', validate(createContentSchema), adminCmsController.create);
router.patch(
  '/:id',
  validate(contentIdParamSchema, 'params'),
  validate(updateContentSchema),
  adminCmsController.update
);
router.delete('/:id', validate(contentIdParamSchema, 'params'), adminCmsController.remove);

export const adminCmsRouter = router;
