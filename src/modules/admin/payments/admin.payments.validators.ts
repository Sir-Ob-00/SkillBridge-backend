import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const listPaymentsQuerySchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const paymentIdParamSchema = z.object({
  id: z.string().uuid('Invalid payment id'),
});

export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
export type PaymentIdParam = z.infer<typeof paymentIdParamSchema>;
