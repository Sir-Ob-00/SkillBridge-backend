import { z } from 'zod';

export const createSkillSchema = z.object({
  name: z.string().trim().min(2).max(60),
  categoryId: z.string().uuid('Invalid category id'),
  active: z.boolean().optional(),
});

export const updateSkillSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  categoryId: z.string().uuid('Invalid category id').optional(),
  active: z.boolean().optional(),
});

export const skillIdParamSchema = z.object({
  id: z.string().uuid('Invalid skill id'),
});

export const listSkillsQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  activeOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => value === 'true'),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
export type SkillIdParam = z.infer<typeof skillIdParamSchema>;
export type ListSkillsQuery = z.infer<typeof listSkillsQuerySchema>;
