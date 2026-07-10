import { Router } from 'express';
import { adminVerificationController } from './admin.verification.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  listVerificationsQuerySchema,
  artisanIdParamSchema,
  reviewNoteSchema,
} from './admin.verification.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', validate(listVerificationsQuerySchema, 'query'), adminVerificationController.list);
router.get('/:id', validate(artisanIdParamSchema, 'params'), adminVerificationController.getById);
router.patch(
  '/:id/approve',
  validate(artisanIdParamSchema, 'params'),
  validate(reviewNoteSchema),
  adminVerificationController.approve
);
router.patch(
  '/:id/reject',
  validate(artisanIdParamSchema, 'params'),
  validate(reviewNoteSchema),
  adminVerificationController.reject
);
router.patch(
  '/:id/request-changes',
  validate(artisanIdParamSchema, 'params'),
  validate(reviewNoteSchema),
  adminVerificationController.requestChanges
);

export const adminVerificationsRouter = router;
