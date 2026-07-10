import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';

const createNotificationSchema = z.object({ title: z.string().trim().min(1), body: z.string().trim().min(1), targetRole: z.enum(['student', 'artisan', 'admin']).optional() });

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', notificationsController.list);
router.post('/', validate(createNotificationSchema), notificationsController.create);

export const notificationsRouter = router;
