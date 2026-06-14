import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { bookingsService } from './bookings.service';
import {
  CreateBookingInput,
  UpdateBookingStatusInput,
  ListBookingsQuery,
  BookingIdParam,
} from './bookings.validators';

export const bookingsController = {
  create: asyncHandler(async (req: Request<unknown, unknown, CreateBookingInput>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const booking = await bookingsService.create(req.user.id, req.body);
    return sendSuccess(res, booking, 'Booking request created.', 201);
  }),

  list: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListBookingsQuery>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const { items, meta } = await bookingsService.list(req.user.id, req.user.role, req.query);
      return sendPaginated(res, items, meta);
    }
  ),

  getById: asyncHandler(async (req: Request<BookingIdParam>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const booking = await bookingsService.getById(req.params.id, req.user.id, req.user.role);
    return sendSuccess(res, booking);
  }),

  updateStatus: asyncHandler(
    async (req: Request<BookingIdParam, unknown, UpdateBookingStatusInput>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const booking = await bookingsService.updateStatus(
        req.params.id,
        req.user.id,
        req.user.role,
        req.body.status
      );
      return sendSuccess(res, booking, 'Booking status updated.');
    }
  ),
};
