import { Router } from 'express';
import { adminProfileController } from './admin.profile.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import { adminUpdateProfileSchema } from './admin.profile.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminProfileController.getMyProfile);
router.patch('/', validate(adminUpdateProfileSchema), adminProfileController.updateMyProfile);

export const adminProfileRouter = router;
