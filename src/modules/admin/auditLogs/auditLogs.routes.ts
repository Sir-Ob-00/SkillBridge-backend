import { Router } from 'express';
import { auditLogsController } from './auditLogs.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { listAuditLogsQuerySchema } from './auditLogs.controller';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', validate(listAuditLogsQuerySchema, 'query'), auditLogsController.list);

export const auditLogsRouter = router;
