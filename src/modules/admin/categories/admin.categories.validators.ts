import { z } from 'zod';

export const categoryStatusSchema = z.object({
  active: z.boolean(),
});

export const reorderCategoriesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type CategoryStatusInput = z.infer<typeof categoryStatusSchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
