import { Router } from 'express';
import { adminBookingsController } from './admin.bookings.controller';
import { requireAuth } from '../../../middlewares/requireAuth';
import { adminOnly } from '../../../middlewares/adminOnly';
import { validate } from '../../../middlewares/validate';
import {
  listBookingsQuerySchema,
  bookingIdParamSchema,
  updateBookingStatusSchema,
} from '../../bookings/bookings.validators';

const router = Router();

router.use(requireAuth, adminOnly);

router.get('/', validate(listBookingsQuerySchema, 'query'), adminBookingsController.list as any);
router.get('/statistics', adminBookingsController.statistics);
router.get('/export', adminBookingsController.export);
router.get('/:id', validate(bookingIdParamSchema, 'params'), adminBookingsController.getById as any);
router.get('/:id/timeline', validate(bookingIdParamSchema, 'params'), adminBookingsController.getTimeline as any);
router.patch('/:id/status', validate(bookingIdParamSchema, 'params'), validate(updateBookingStatusSchema), adminBookingsController.updateStatus as any);
router.patch('/:id/cancel', validate(bookingIdParamSchema, 'params'), adminBookingsController.cancel as any);
router.patch('/:id/complete', validate(bookingIdParamSchema, 'params'), adminBookingsController.complete as any);
router.patch('/:id/dispute', validate(bookingIdParamSchema, 'params'), adminBookingsController.dispute as any);

export const adminBookingsRouter = router;
