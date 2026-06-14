import { Router } from 'express';
import { reportsController } from './reports.controller';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireAdmin } from '../../middlewares/requireRole';
import { validate } from '../../middlewares/validate';
import {
  createReportSchema,
  updateReportStatusSchema,
  listReportsQuerySchema,
  reportIdParamSchema,
} from './reports.validators';

const router = Router();

router.post('/', requireAuth, validate(createReportSchema), reportsController.create);

router.get(
  '/',
  requireAuth,
  requireAdmin,
  validate(listReportsQuerySchema, 'query'),
  reportsController.list
);

router.patch(
  '/:id/status',
  requireAuth,
  requireAdmin,
  validate(reportIdParamSchema, 'params'),
  validate(updateReportStatusSchema),
  reportsController.updateStatus
);

export const reportsRouter = router;
