import { z } from 'zod';

export const portfolioItemIdParamSchema = z.object({
  id: z.string().uuid('Invalid portfolio item id'),
});

export type PortfolioItemIdParam = z.infer<typeof portfolioItemIdParamSchema>;
