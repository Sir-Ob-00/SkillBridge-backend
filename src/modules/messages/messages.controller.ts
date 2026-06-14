import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import { messagesService } from './messages.service';
import { ChatIdParam, ListMessagesQuery } from './messages.validators';

export const messagesController = {
  listChats: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const chats = await messagesService.listChats(req.user.id);
    return sendSuccess(res, chats);
  }),

  getMessages: asyncHandler(
    async (req: Request<ChatIdParam, unknown, unknown, ListMessagesQuery>, res: Response) => {
      if (!req.user) throw ApiError.unauthorized();
      const { items, meta } = await messagesService.getMessages(
        req.params.chatId,
        req.user.id,
        req.query
      );
      return sendPaginated(res, items, meta);
    }
  ),

  markRead: asyncHandler(async (req: Request<ChatIdParam>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await messagesService.markRead(req.params.chatId, req.user.id);
    return sendSuccess(res, null, result.message);
  }),
};
