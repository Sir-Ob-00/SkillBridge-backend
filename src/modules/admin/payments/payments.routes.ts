import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { listPaymentsQuerySchema, paymentIdParamSchema } from './payments.controller';

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', validate(listPaymentsQuerySchema, 'query'), paymentsController.list);
router.get('/:id', validate(paymentIdParamSchema, 'params'), paymentsController.getById);

export const adminPaymentsRouter = router;
