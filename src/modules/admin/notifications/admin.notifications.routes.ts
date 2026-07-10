import { Router } from 'express';
import { adminNotificationsController } from './admin.notifications.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import { createNotificationSchema } from './admin.notifications.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminNotificationsController.list);
router.post('/', validate(createNotificationSchema), adminNotificationsController.create);

export const adminNotificationsRouter = router;
