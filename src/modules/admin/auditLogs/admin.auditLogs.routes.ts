import { Router } from 'express';
import { adminAuditLogsController } from './admin.auditLogs.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { adminOnly } from '../../../middlewares/adminOnly';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/', adminAuditLogsController.list);

export const adminAuditLogsRouter = router;
