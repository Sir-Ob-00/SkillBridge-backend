import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().uuid('Invalid booking id'),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(1000),
});

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const artisanIdParamSchema = z.object({
  artisanId: z.string().uuid('Invalid artisan id'),
});

export const reviewIdParamSchema = z.object({
  id: z.string().uuid('Invalid review id'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type ArtisanIdParam = z.infer<typeof artisanIdParamSchema>;
export type ReviewIdParam = z.infer<typeof reviewIdParamSchema>;
