import { z } from 'zod';
import { adminUpdateUserSchema, userIdParamSchema } from '../users/admin.users.validators';

export const listStudentsQuerySchema = z.object({
  search: z.string().trim().optional(),
  isSuspended: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'email', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateStudentSchema = adminUpdateUserSchema;

export const studentIdParamSchema = userIdParamSchema;

export const studentStatusSchema = z.object({
  isSuspended: z.boolean(),
});

export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentIdParam = z.infer<typeof studentIdParamSchema>;
export type StudentStatusInput = z.infer<typeof studentStatusSchema>;
