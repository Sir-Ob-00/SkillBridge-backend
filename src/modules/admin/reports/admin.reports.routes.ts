import { Router } from 'express';
import { adminReportsController } from './admin.reports.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  updateReportStatusSchema,
  listReportsQuerySchema,
  reportIdParamSchema,
} from '../../reports/reports.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', validate(listReportsQuerySchema, 'query'), adminReportsController.list);
router.patch(
  '/:id/status',
  validate(reportIdParamSchema, 'params'),
  validate(updateReportStatusSchema),
  adminReportsController.updateStatus
);

export const adminReportsRouter = router;
