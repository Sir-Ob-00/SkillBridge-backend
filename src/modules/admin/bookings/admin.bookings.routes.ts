import { Router } from 'express';
import { adminBookingsController } from './admin.bookings.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  bookingIdParamSchema,
  updateBookingStatusSchema,
} from '../../bookings/bookings.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', adminBookingsController.list);
router.get('/:id', validate(bookingIdParamSchema, 'params'), adminBookingsController.getById);
router.patch(
  '/:id/status',
  validate(bookingIdParamSchema, 'params'),
  validate(updateBookingStatusSchema),
  adminBookingsController.updateStatus
);

export const adminBookingsRouter = router;
