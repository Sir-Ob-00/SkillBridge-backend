import { Router } from 'express';
import { adminPaymentsController } from './admin.payments.controller';
import { authenticate } from '../../../middlewares/authenticate';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  listPaymentsQuerySchema,
  paymentIdParamSchema,
} from './admin.payments.validators';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/', validate(listPaymentsQuerySchema, 'query'), adminPaymentsController.list);
router.get('/:id', validate(paymentIdParamSchema, 'params'), adminPaymentsController.getById);

export const adminPaymentsRouter = router;
