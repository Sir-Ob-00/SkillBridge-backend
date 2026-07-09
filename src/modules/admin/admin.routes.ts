import { Router } from 'express';
import { adminController } from './admin.controller';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireAdmin } from '../../middlewares/requireRole';
import { validate } from '../../middlewares/validate';
import {
  approveArtisanSchema,
  rejectArtisanSchema,
  requestChangesSchema,
  artisanIdParamSchema,
  listPendingQuerySchema,
} from './admin.validators';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.post(
  '/:id/approve',
  validate(artisanIdParamSchema, 'params'),
  validate(approveArtisanSchema),
  adminController.approve
);

router.post(
  '/:id/reject',
  validate(artisanIdParamSchema, 'params'),
  validate(rejectArtisanSchema),
  adminController.reject
);

router.post(
  '/:id/request-changes',
  validate(artisanIdParamSchema, 'params'),
  validate(requestChangesSchema),
  adminController.requestChanges
);

router.get(
  '/pending',
  validate(listPendingQuerySchema, 'query'),
  adminController.listPending
);

export const adminRouter = router;
