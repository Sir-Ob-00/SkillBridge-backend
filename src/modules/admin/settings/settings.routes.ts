import { Router } from 'express';
import { settingsController } from './settings.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';

const updateSettingsSchema = z.object({ platformName: z.string().optional(), supportEmail: z.string().email().optional(), maintenanceMode: z.boolean().optional() });

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', settingsController.get);
router.patch('/', validate(updateSettingsSchema), settingsController.update);

export const adminSettingsRouter = router;
