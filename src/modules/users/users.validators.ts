import { z } from 'zod';
import { Role } from '@prisma/client';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  profileImageUrl: z.string().url().optional(),
});

export const listUsersQuerySchema = z.object({
  role: z.nativeEnum(Role).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user id'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
