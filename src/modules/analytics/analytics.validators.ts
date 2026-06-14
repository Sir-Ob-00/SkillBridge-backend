import { z } from 'zod';

export const bookingTrendsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export type BookingTrendsQuery = z.infer<typeof bookingTrendsQuerySchema>;
