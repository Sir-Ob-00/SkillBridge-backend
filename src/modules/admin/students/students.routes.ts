import { Router } from 'express';
import { adminStudentsController } from './students.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminStudentsController.list as any);
router.get('/statistics', adminStudentsController.statistics);
router.get('/export', adminStudentsController.export);
router.get('/:id', adminStudentsController.getById as any);
router.patch('/:id', adminStudentsController.update as any);
router.patch('/:id/status', adminStudentsController.setStatus as any);
router.patch('/:id/suspend', adminStudentsController.suspend as any);
router.patch('/:id/unsuspend', adminStudentsController.unsuspend as any);
router.delete('/:id', adminStudentsController.remove as any);

export const adminStudentsRouter = router;
