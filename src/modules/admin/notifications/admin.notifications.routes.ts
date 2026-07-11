import { Router } from 'express';
import { adminNotificationsController } from './admin.notifications.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminNotificationsController.list as any);
router.get('/statistics', adminNotificationsController.statistics);
router.post('/', adminNotificationsController.create as any);
router.post('/broadcast', adminNotificationsController.broadcast as any);
router.patch('/:id', adminNotificationsController.markRead as any);
router.delete('/:id', adminNotificationsController.remove);

export const adminNotificationsRouter = router;
