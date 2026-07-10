import { Router } from 'express';
import { bookingsController } from './bookings.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { requireAdmin } from '../../../middlewares/requireRole';
import { validate } from '../../../middlewares/validate';
import { listBookingsQuerySchema, bookingIdParamSchema } from './bookings.controller';
import { z } from 'zod';

const updateStatusSchema = z.object({ status: z.string().min(1) });

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', validate(listBookingsQuerySchema, 'query'), bookingsController.list);
router.get('/:id', validate(bookingIdParamSchema, 'params'), bookingsController.getById);
router.patch('/:id/status', validate(bookingIdParamSchema, 'params'), validate(updateStatusSchema), bookingsController.updateStatus);

export const adminBookingsRouter = router;
