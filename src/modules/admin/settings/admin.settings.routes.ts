import { Router } from 'express';
import { adminSettingsController } from './admin.settings.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import { updateSettingsSchema } from './admin.settings.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminSettingsController.getSettings);
router.patch('/', validate(updateSettingsSchema), adminSettingsController.updateSettings);

export const adminSettingsRouter = router;
