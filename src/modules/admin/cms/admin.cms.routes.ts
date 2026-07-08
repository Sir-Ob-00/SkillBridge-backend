import { Router } from 'express';
import { adminCmsController } from './admin.cms.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  createContentSchema,
  updateContentSchema,
  contentIdParamSchema,
} from './admin.cms.validators';

const router = Router();

router.use(authenticate, adminOnly);

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
