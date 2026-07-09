import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/ApiError';
import { validate } from '../../../middlewares/validate';
import { z } from 'zod';
import { paymentsService } from './payments.service';

export const paymentIdParamSchema = z.object({ id: z.string().uuid() });
export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaymentIdParam = z.infer<typeof paymentIdParamSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;

export const paymentsController = {
  list: asyncHandler(async (req: any, res: Response) => {
    const { items, meta } = await paymentsService.list(req.query);
    return sendPaginated(res, items, meta);
  }),

  getById: asyncHandler(async (req: any, res: Response) => {
    const payment = await paymentsService.getById(req.params.id);
    return sendSuccess(res, payment);
  }),
};
