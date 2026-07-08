import { Router } from 'express';
import { adminReportsController } from './admin.reports.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  updateReportStatusSchema,
  listReportsQuerySchema,
  reportIdParamSchema,
} from '../../reports/reports.validators';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/', validate(listReportsQuerySchema, 'query'), adminReportsController.list);
router.patch(
  '/:id/status',
  validate(reportIdParamSchema, 'params'),
  validate(updateReportStatusSchema),
  adminReportsController.updateStatus
);

export const adminReportsRouter = router;
