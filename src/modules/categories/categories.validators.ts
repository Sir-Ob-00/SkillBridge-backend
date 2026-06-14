import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(60),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  active: z.boolean().optional(),
});

export const listCategoriesQuerySchema = z.object({
  activeOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => value === 'true'),
});

export const categoryIdParamSchema = z.object({
  id: z.string().uuid('Invalid category id'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;
