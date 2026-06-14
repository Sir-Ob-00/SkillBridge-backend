import { Router } from 'express';
import { bookingsController } from './bookings.controller';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireRole } from '../../middlewares/requireRole';
import { validate } from '../../middlewares/validate';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  listBookingsQuerySchema,
  bookingIdParamSchema,
} from './bookings.validators';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listBookingsQuerySchema, 'query'), bookingsController.list);

router.post(
  '/',
  requireRole(['student']),
  validate(createBookingSchema),
  bookingsController.create
);

router.get('/:id', validate(bookingIdParamSchema, 'params'), bookingsController.getById);

router.patch(
  '/:id/status',
  validate(bookingIdParamSchema, 'params'),
  validate(updateBookingStatusSchema),
  bookingsController.updateStatus
);

export const bookingsRouter = router;
