import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { adminPaymentsService } from './admin.payments.service';
import { ListPaymentsQuery, PaymentIdParam } from './admin.payments.validators';

export const adminPaymentsController = {
  list: asyncHandler(
    async (req: Request<unknown, unknown, unknown, ListPaymentsQuery>, res: Response) => {
      const { items, meta } = await adminPaymentsService.list(req.query);
      return sendPaginated(res, items, meta);
    }
  ),

  getById: asyncHandler(async (req: Request<PaymentIdParam>, res: Response) => {
    const payment = await adminPaymentsService.getById(req.params.id);
    return sendSuccess(res, payment);
  }),
};
