import { Router } from 'express';
import { adminSettingsController } from './admin.settings.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import { updateSettingsSchema } from './admin.settings.validators';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/', adminSettingsController.getSettings);
router.patch('/', validate(updateSettingsSchema), adminSettingsController.updateSettings);

export const adminSettingsRouter = router;
