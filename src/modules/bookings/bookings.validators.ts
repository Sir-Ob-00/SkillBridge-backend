import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const createBookingSchema = z.object({
  artisanId: z.string().uuid('Invalid artisan id'),
  serviceId: z.string().uuid('Invalid service id').optional(),
  serviceTitle: z.string().trim().min(2).max(150).optional(),
  price: z.coerce.number().nonnegative().optional(),
  scheduledTime: z.coerce.date(),
  notes: z.string().trim().max(500).optional(),
}).refine((data) => data.serviceId || (data.serviceTitle && data.price !== undefined), {
  message: 'Either serviceId, or both serviceTitle and price, must be provided.',
  path: ['serviceId'],
});

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
});

export const listBookingsQuerySchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const bookingIdParamSchema = z.object({
  id: z.string().uuid('Invalid booking id'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
export type BookingIdParam = z.infer<typeof bookingIdParamSchema>;
