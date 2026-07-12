import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

export const listArtisansQuerySchema = z.object({
  search: z.string().trim().optional(),
  applicationStatus: z.nativeEnum(ApplicationStatus).optional(),
  status: z.enum(['VERIFIED', 'UNVERIFIED', 'PENDING', 'REJECTED', 'ACTIVE']).optional(),
  isSuspended: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['businessName', 'rating', 'createdAt', 'reviewCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateArtisanSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  businessName: z.string().trim().min(2).max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  pricingFrom: z.coerce.number().nonnegative().optional(),
  location: z.string().trim().max(160).optional(),
  isSuspended: z.boolean().optional(),
  applicationStatus: z.nativeEnum(ApplicationStatus).optional(),
});

export const artisanStatusSchema = z.object({
  applicationStatus: z.nativeEnum(ApplicationStatus),
});

export const artisanIdParamSchema = z.object({
  id: z.string().uuid('Invalid artisan id'),
});

export type ListArtisansQuery = z.infer<typeof listArtisansQuerySchema>;
export type UpdateArtisanInput = z.infer<typeof updateArtisanSchema>;
export type ArtisanStatusInput = z.infer<typeof artisanStatusSchema>;
export type ArtisanIdParam = z.infer<typeof artisanIdParamSchema>;
