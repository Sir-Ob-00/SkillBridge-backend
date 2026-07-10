import { Router } from 'express';
import { reportsController } from './reports.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { listReportsQuerySchema, reportIdParamSchema } from './reports.controller';
import { z } from 'zod';

const updateStatusSchema = z.object({ status: z.enum(['open', 'resolved', 'escalated']) });

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', validate(listReportsQuerySchema, 'query'), reportsController.list);
router.patch('/:id/status', validate(reportIdParamSchema, 'params'), validate(updateStatusSchema), reportsController.updateStatus);

export const adminReportsRouter = router;
