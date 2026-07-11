import { Router } from 'express';
import { adminProfileController } from './admin.profile.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import { adminUpdateProfileSchema, changePasswordSchema } from './admin.profile.validators';
import { imageUpload } from '../../users/upload';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminProfileController.getMyProfile);
router.patch('/', validate(adminUpdateProfileSchema), adminProfileController.updateMyProfile as any);
router.patch('/password', validate(changePasswordSchema), adminProfileController.changePassword as any);
router.patch('/avatar', imageUpload.single('avatar'), adminProfileController.updateAvatar as any);

export const adminProfileRouter = router;
