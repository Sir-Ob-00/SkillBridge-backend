import { z } from 'zod';

export const chatIdParamSchema = z.object({
  chatId: z.string().min(1, 'chatId is required'),
});

export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});

export type ChatIdParam = z.infer<typeof chatIdParamSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
