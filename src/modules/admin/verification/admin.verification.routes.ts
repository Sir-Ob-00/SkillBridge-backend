import { Router } from 'express';
import { adminVerificationController } from './admin.verification.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminVerificationController.list as any);
router.get('/statistics', adminVerificationController.statistics);
router.get('/:id', adminVerificationController.getById as any);
router.get('/:id/documents', adminVerificationController.getDocuments as any);
router.post('/:id/approve', adminVerificationController.approve as any);
router.post('/:id/reject', adminVerificationController.reject as any);
router.post('/:id/request-changes', adminVerificationController.requestChanges as any);
router.post('/:id/note', adminVerificationController.addNote as any);
router.patch('/:id/status', adminVerificationController.setStatus as any);

export const adminVerificationsRouter = router;
