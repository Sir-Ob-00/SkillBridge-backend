import { Router } from 'express';
import { applicationsController } from './applications.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import {
  listApplicationsQuerySchema,
  applicationIdParamSchema,
  approveApplicationSchema,
  rejectApplicationSchema,
  requestChangesSchema,
} from './applications.validators';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/', validate(listApplicationsQuerySchema, 'query'), applicationsController.list);
router.get('/:id', validate(applicationIdParamSchema, 'params'), applicationsController.getById);
router.post(
  '/:id/approve',
  validate(applicationIdParamSchema, 'params'),
  validate(approveApplicationSchema),
  applicationsController.approve
);
router.post(
  '/:id/reject',
  validate(applicationIdParamSchema, 'params'),
  validate(rejectApplicationSchema),
  applicationsController.reject
);
router.post(
  '/:id/request-changes',
  validate(applicationIdParamSchema, 'params'),
  validate(requestChangesSchema),
  applicationsController.requestChanges
);

export const applicationsRouter = router;
