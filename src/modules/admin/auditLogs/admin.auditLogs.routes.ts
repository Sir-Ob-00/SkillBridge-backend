import { Router } from 'express';
import { adminAuditLogsController } from './admin.auditLogs.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminAuditLogsController.list as any);
router.get('/export', adminAuditLogsController.export);
router.get('/:id', adminAuditLogsController.getById as any);

export const adminAuditLogsRouter = router;
