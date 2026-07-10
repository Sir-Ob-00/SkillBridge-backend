import { Router } from 'express';
import { usersController } from './users.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { listUsersQuerySchema, userIdParamSchema } from './users.controller';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', validate(listUsersQuerySchema, 'query'), usersController.list);
router.get('/:id', validate(userIdParamSchema, 'params'), usersController.getById);
router.post('/:id/suspend', validate(userIdParamSchema, 'params'), usersController.suspend);
router.post('/:id/unsuspend', validate(userIdParamSchema, 'params'), usersController.unsuspend);
router.delete('/:id', validate(userIdParamSchema, 'params'), usersController.remove);

export const adminUsersRouter = router;
