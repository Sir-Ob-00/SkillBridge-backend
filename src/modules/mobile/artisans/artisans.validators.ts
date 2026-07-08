import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

export const upsertArtisanProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(100).optional(),
  bio: z.string().trim().max(1000).optional(),
  skills: z.array(z.string().trim().min(1)).max(20).optional(),
  categories: z.array(z.string().trim().min(1)).max(10).optional(),
  pricingFrom: z.coerce.number().nonnegative().optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
  location: z.string().trim().max(120).optional(),
  profileImageUrl: z.string().url().optional(),
  availability: z
    .array(
      z.object({
        day: z.enum([
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ]),
        startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:mm format'),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:mm format'),
      })
    )
    .optional(),
});

export const updateAvailabilitySchema = z.object({
  slots: z
    .array(
      z.object({
        day: z.enum([
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ]),
        startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:mm format'),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:mm format'),
      })
    )
    .optional(),
});

export const listArtisansQuerySchema = z.object({
  query: z.string().trim().optional(),
  category: z.string().trim().optional(),
  status: z.nativeEnum(ApplicationStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const artisanIdParamSchema = z.object({
  id: z.string().uuid('Invalid artisan id'),
});

export const portfolioItemParamSchema = z.object({
  id: z.string().uuid('Invalid artisan id'),
  itemId: z.string().uuid('Invalid portfolio item id'),
});

export const addPortfolioItemSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
});

export const createServiceSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(1000),
  price: z.coerce.number().positive(),
  durationMinutes: z.coerce.number().int().positive().max(24 * 60),
  category: z.string().trim().min(1),
});

export const updateServiceSchema = createServiceSchema.partial();

export const serviceIdParamSchema = z.object({
  id: z.string().uuid('Invalid artisan id'),
  serviceId: z.string().uuid('Invalid service id'),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceIdParam = z.infer<typeof serviceIdParamSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;

export type UpsertArtisanProfileInput = z.infer<typeof upsertArtisanProfileSchema>;
export type AddPortfolioItemInput = z.infer<typeof addPortfolioItemSchema>;
export type ListArtisansQuery = z.infer<typeof listArtisansQuerySchema>;
export type ArtisanIdParam = z.infer<typeof artisanIdParamSchema>;
export type PortfolioItemParam = z.infer<typeof portfolioItemParamSchema>;
