import { Router } from 'express';
import { adminAuthController } from './admin.auth.controller';
import { validate } from '../../../middlewares/validate';
import { loginSchema } from '../../auth/auth.validators';

const router = Router();

router.post('/', validate(loginSchema), adminAuthController.login);

export const adminAuthRouter = router;
