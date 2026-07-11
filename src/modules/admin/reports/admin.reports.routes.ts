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
import { z } from 'zod';

const router = Router();

router.use(requireAuth, adminOnly);

router.get(
  '/',
  validate(listReportsQuerySchema, 'query'),
  adminReportsController.list as any
);
router.get('/statistics', adminReportsController.statistics);
router.get('/export', adminReportsController.export);
router.get(
  '/:id',
  validate(reportIdParamSchema, 'params'),
  adminReportsController.getById as any
);
router.patch(
  '/:id/status',
  validate(reportIdParamSchema, 'params'),
  validate(updateReportStatusSchema),
  adminReportsController.updateStatus as any
);
router.patch(
  '/:id/assign',
  validate(reportIdParamSchema, 'params'),
  adminReportsController.assign as any
);
router.patch(
  '/:id/resolve',
  validate(reportIdParamSchema, 'params'),
  validate(z.object({ resolution: z.string().trim().max(2000).optional() })),
  adminReportsController.resolve as any
);
router.patch(
  '/:id/dismiss',
  validate(reportIdParamSchema, 'params'),
  adminReportsController.dismiss as any
);
router.post(
  '/:id/note',
  validate(reportIdParamSchema, 'params'),
  validate(z.object({ note: z.string().trim().min(2).max(2000) })),
  adminReportsController.addNote as any
);

export const adminReportsRouter = router;
