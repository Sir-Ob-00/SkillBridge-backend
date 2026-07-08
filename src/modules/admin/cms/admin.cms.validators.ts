import { z } from 'zod';

export const createContentSchema = z.object({
  key: z.string().trim().min(2).max(80),
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().max(20000),
  published: z.boolean().default(true),
});

export const updateContentSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  body: z.string().trim().max(20000).optional(),
  published: z.boolean().optional(),
});

export const contentIdParamSchema = z.object({
  id: z.string().uuid('Invalid content id'),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type ContentIdParam = z.infer<typeof contentIdParamSchema>;
