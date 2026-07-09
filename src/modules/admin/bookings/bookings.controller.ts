import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';
import { bookingsService } from './bookings.service';

export const bookingIdParamSchema = z.object({ id: z.string().uuid() });
export const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected']).optional(),
});

export type BookingIdParam = z.infer<typeof bookingIdParamSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;

export const bookingsController = {
  list: asyncHandler(async (req: any, res: Response) => {
    const { items, meta } = await bookingsService.list(req.query);
    return sendPaginated(res, items, meta);
  }),

  getById: asyncHandler(async (req: any, res: Response) => {
    const booking = await bookingsService.getById(req.params.id);
    return sendSuccess(res, booking);
  }),

  updateStatus: asyncHandler(async (req: any, res: Response) => {
    const booking = await bookingsService.updateStatus(req.params.id, req.body.status);
    return sendSuccess(res, booking, 'Booking status updated.');
  }),
};
