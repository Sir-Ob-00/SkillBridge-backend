import { Router } from 'express';
import { usersController } from './users.controller';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireAdmin } from '../../middlewares/requireRole';
import { validate } from '../../middlewares/validate';
import {
  updateProfileSchema,
  listUsersQuerySchema,
  userIdParamSchema,
} from './users.validators';

const router = Router();

// Self
router.get('/me', requireAuth, usersController.getMe);
router.patch('/me', requireAuth, validate(updateProfileSchema), usersController.updateMe);

// Admin
router.get(
  '/',
  requireAuth,
  requireAdmin,
  validate(listUsersQuerySchema, 'query'),
  usersController.list
);
router.get(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(userIdParamSchema, 'params'),
  usersController.getById
);
router.post(
  '/:id/suspend',
  requireAuth,
  requireAdmin,
  validate(userIdParamSchema, 'params'),
  usersController.suspend
);
router.post(
  '/:id/unsuspend',
  requireAuth,
  requireAdmin,
  validate(userIdParamSchema, 'params'),
  usersController.unsuspend
);
router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(userIdParamSchema, 'params'),
  usersController.remove
);

export const usersRouter = router;
