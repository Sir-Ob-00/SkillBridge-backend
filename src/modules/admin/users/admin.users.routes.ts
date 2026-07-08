import { Router } from 'express';
import { adminUsersController } from './admin.users.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  adminUpdateUserSchema,
  listAdminUsersQuerySchema,
  userIdParamSchema,
} from './admin.users.validators';

const router = Router();

router.use(authenticate, adminOnly);

// Role-scoped collections must be registered before `/:id`.
router.get('/', validate(listAdminUsersQuerySchema, 'query'), adminUsersController.list);
router.get('/students', validate(listAdminUsersQuerySchema, 'query'), adminUsersController.listStudents);
router.get('/artisans', validate(listAdminUsersQuerySchema, 'query'), adminUsersController.listArtisans);
router.get('/admins', validate(listAdminUsersQuerySchema, 'query'), adminUsersController.listAdministrators);

router.get('/:id', validate(userIdParamSchema, 'params'), adminUsersController.getById);
router.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(adminUpdateUserSchema),
  adminUsersController.update
);
router.delete('/:id', validate(userIdParamSchema, 'params'), adminUsersController.remove);

export const adminUsersRouter = router;
