import { Router } from 'express';
import { adminProfileController } from './admin.profile.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import { adminUpdateProfileSchema } from './admin.profile.validators';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/', adminProfileController.getMyProfile);
router.patch('/', validate(adminUpdateProfileSchema), adminProfileController.updateMyProfile);

export const adminProfileRouter = router;
