import { Router } from 'express';
import { profileController } from './profile.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { updateAdminProfileSchema } from './profile.controller';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', profileController.get);
router.patch('/', validate(updateAdminProfileSchema), profileController.update);

export const adminProfileRouter = router;
