import { Router } from 'express';
import { adminPaymentsController } from './admin.payments.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  listPaymentsQuerySchema,
  paymentIdParamSchema,
} from './admin.payments.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', validate(listPaymentsQuerySchema, 'query'), adminPaymentsController.list);
router.get('/:id', validate(paymentIdParamSchema, 'params'), adminPaymentsController.getById);

export const adminPaymentsRouter = router;
