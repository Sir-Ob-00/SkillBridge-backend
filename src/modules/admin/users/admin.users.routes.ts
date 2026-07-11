import { Router } from 'express';
import { adminUsersController } from './admin.users.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  adminUpdateUserSchema,
  listAdminUsersQuerySchema,
  createAdminSchema,
  adminStatusSchema,
  userIdParamSchema,
} from './admin.users.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', validate(listAdminUsersQuerySchema, 'query'), adminUsersController.list);
router.get('/students', validate(listAdminUsersQuerySchema, 'query'), adminUsersController.listStudents);
router.get('/artisans', validate(listAdminUsersQuerySchema, 'query'), adminUsersController.listArtisans);
router.get('/admins', validate(listAdminUsersQuerySchema, 'query'), adminUsersController.listAdministrators);

router.get('/:id', validate(userIdParamSchema, 'params'), adminUsersController.getById);
router.post('/', validate(createAdminSchema), adminUsersController.createAdmin as any);
router.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(adminUpdateUserSchema),
  adminUsersController.update as any
);
router.patch(
  '/:id/status',
  validate(userIdParamSchema, 'params'),
  validate(adminStatusSchema),
  adminUsersController.updateStatus as any
);
router.delete('/:id', validate(userIdParamSchema, 'params'), adminUsersController.remove);

export const adminUsersRouter = router;
