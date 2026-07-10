import { z } from 'zod';

export const upsertArtisanProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(100).optional(),
  bio: z.string().trim().max(1000).optional(),
  skills: z.array(z.string().uuid()).max(20).optional(),
  categories: z.array(z.string().trim().min(1)).max(10).optional(),
  pricingFrom: z.coerce.number().nonnegative().optional(),
  location: z.string().trim().max(120).optional(),
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

export const addPortfolioItemSchema = z.object({
  imageUrl: z.string().url('imageUrl must be a valid URL'),
  caption: z.string().trim().max(200).optional(),
});

export const listArtisansQuerySchema = z.object({
  query: z.string().trim().optional(),
  category: z.string().trim().optional(),
  applicationStatus: z.enum([
    'EMAIL_VERIFICATION_PENDING',
    'PENDING_PROFILE',
    'PENDING_REVIEW',
    'UNDER_REVIEW',
    'CHANGES_REQUESTED',
    'ACTIVE',
    'REJECTED',
  ]).optional(),
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

export const createServiceSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(1000),
  price: z.coerce.number().positive(),
  durationMinutes: z.coerce.number().int().positive().max(24 * 60),
  categoryId: z.string().uuid('categoryId must be a valid UUID'),
});

export const updateServiceSchema = createServiceSchema.partial();

export const serviceIdParamSchema = z.object({
  id: z.string().uuid('Invalid artisan id'),
  serviceId: z.string().uuid('Invalid service id'),
});

export const approveArtisanSchema = z.object({
  notes: z.string().trim().max(1000).optional(),
});

export const rejectArtisanSchema = z.object({
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(2000),
});

export const requestChangesSchema = z.object({
  changes: z.string().trim().min(5, 'Requested changes must be at least 5 characters').max(2000),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceIdParam = z.infer<typeof serviceIdParamSchema>;

export type ApproveArtisanInput = z.infer<typeof approveArtisanSchema>;
export type RejectArtisanInput = z.infer<typeof rejectArtisanSchema>;
export type RequestChangesInput = z.infer<typeof requestChangesSchema>;

export type UpsertArtisanProfileInput = z.infer<typeof upsertArtisanProfileSchema>;
export type AddPortfolioItemInput = z.infer<typeof addPortfolioItemSchema>;
export type ListArtisansQuery = z.infer<typeof listArtisansQuerySchema>;
export type ArtisanIdParam = z.infer<typeof artisanIdParamSchema>;
export type PortfolioItemParam = z.infer<typeof portfolioItemParamSchema>;
