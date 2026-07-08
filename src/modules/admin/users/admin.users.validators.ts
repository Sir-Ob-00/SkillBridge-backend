import { z } from 'zod';
import { Role } from '@prisma/client';

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  role: z.nativeEnum(Role).optional(),
  isSuspended: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
});

export const listAdminUsersQuerySchema = z.object({
  role: z.nativeEnum(Role).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user id'),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
