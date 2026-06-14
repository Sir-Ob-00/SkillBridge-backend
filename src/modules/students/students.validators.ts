import { z } from 'zod';

export const saveArtisanSchema = z.object({
  artisanId: z.string().uuid('Invalid artisan id'),
});

export const artisanIdParamSchema = z.object({
  artisanId: z.string().uuid('Invalid artisan id'),
});

export type SaveArtisanInput = z.infer<typeof saveArtisanSchema>;
export type ArtisanIdParam = z.infer<typeof artisanIdParamSchema>;
