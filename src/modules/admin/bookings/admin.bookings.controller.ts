import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/apiResponse';
import { adminBookingsService } from './admin.bookings.service';
import {
  listBookingsQuerySchema,
  bookingIdParamSchema,
  updateBookingStatusSchema,
} from '../../bookings/bookings.validators';
import { validate } from '../../../middlewares/validate';
import { recordAudit, getClientIp } from '../../../utils/audit';

export const adminBookingsController = {
  list: [
    validate(listBookingsQuerySchema, 'query'),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await adminBookingsService.list(req.query as any);
      return sendSuccess(res, result);
    }),
  ],

  statistics: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminBookingsService.statistics();
    return sendSuccess(res, stats);
  }),

  export: asyncHandler(async (_req: Request, res: Response) => {
    const rows = await adminBookingsService.export();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.json"');
    return res.status(200).json({ success: true, data: rows });
  }),

  getById: [
    validate(bookingIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const booking = await adminBookingsService.getById(req.params.id);
      return sendSuccess(res, booking);
    }),
  ],

  getTimeline: [
    validate(bookingIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const timeline = await adminBookingsService.getTimeline(req.params.id);
      return sendSuccess(res, timeline);
    }),
  ],

  updateStatus: [
    validate(bookingIdParamSchema, 'params'),
    validate(updateBookingStatusSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const booking = await adminBookingsService.updateStatus(req.params.id, req.body.status);
      await recordAudit({ adminId: req.user?.id, action: 'UPDATE_STATUS', resource: 'booking', resourceId: req.params.id, ipAddress: getClientIp(req), newValue: req.body });
      return sendSuccess(res, booking, 'Booking status updated.');
    }),
  ],

  cancel: [
    validate(bookingIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const booking = await adminBookingsService.cancel(req.params.id);
      await recordAudit({ adminId: req.user?.id, action: 'CANCEL', resource: 'booking', resourceId: req.params.id, ipAddress: getClientIp(req) });
      return sendSuccess(res, booking, 'Booking cancelled.');
    }),
  ],

  complete: [
    validate(bookingIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const booking = await adminBookingsService.complete(req.params.id);
      await recordAudit({ adminId: req.user?.id, action: 'COMPLETE', resource: 'booking', resourceId: req.params.id, ipAddress: getClientIp(req) });
      return sendSuccess(res, booking, 'Booking marked completed.');
    }),
  ],

  dispute: [
    validate(bookingIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const booking = await adminBookingsService.dispute(req.params.id);
      await recordAudit({ adminId: req.user?.id, action: 'DISPUTE', resource: 'booking', resourceId: req.params.id, ipAddress: getClientIp(req) });
      return sendSuccess(res, booking, 'Booking marked as disputed.');
    }),
  ],
};
