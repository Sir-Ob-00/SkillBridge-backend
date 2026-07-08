import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminBookingsService } from './admin.bookings.service';
import { ListBookingsQuery } from '../../bookings/bookings.validators';

export const adminBookingsController = {
  list: asyncHandler(async (req: Request<unknown, unknown, unknown, ListBookingsQuery>, res: Response) => {
    const { items, meta } = await adminBookingsService.list(req.query);
    return sendSuccess(res, { items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const booking = await adminBookingsService.getById(req.params.id);
    return sendSuccess(res, booking);
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const booking = await adminBookingsService.updateStatus(req.params.id, req.body.status);
    return sendSuccess(res, booking, 'Booking status updated.');
  }),
};
