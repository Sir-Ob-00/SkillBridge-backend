import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { parsePagination } from '../../utils/pagination';
import { buildPaginationMeta } from '../../utils/apiResponse';
import { computeChatId, otherParticipant } from './chatId';
import { ListMessagesQuery } from './messages.validators';

export const messagesService = {
  /**
   * Lists distinct conversations for a user, each with its most recent message.
   */
  async listChats(userId: string) {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { timestamp: 'desc' },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    const chatMap = new Map<string, (typeof messages)[number]>();
    for (const message of messages) {
      if (!chatMap.has(message.chatId)) {
        chatMap.set(message.chatId, message);
      }
    }

    return Array.from(chatMap.values()).map((message) => {
      const otherId = otherParticipant(message.chatId, userId);
      const otherUser = message.senderId === otherId ? message.sender : message.receiver;

      return {
        id: message.chatId,
        participantIds: [message.senderId, message.receiverId],
        otherUser,
        lastMessage: {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          text: message.message,
          createdAt: message.timestamp,
          status: message.readAt ? 'read' : 'sent',
        },
        updatedAt: message.timestamp,
      };
    });
  },

  async getMessages(chatId: string, userId: string, query: ListMessagesQuery) {
    const other = otherParticipant(chatId, userId);
    if (!other) {
      throw ApiError.forbidden('You do not have access to this conversation.');
    }

    const { page, pageSize, skip, take } = parsePagination(query);

    const [rows, totalItems] = await Promise.all([
      prisma.message.findMany({
        where: { chatId },
        orderBy: { timestamp: 'desc' },
        skip,
        take,
      }),
      prisma.message.count({ where: { chatId } }),
    ]);

    // Return oldest-first for chat UIs, most-recent page first.
    const items = rows
      .slice()
      .reverse()
      .map((row) => ({
        id: row.id,
        chatId: row.chatId,
        senderId: row.senderId,
        text: row.message,
        createdAt: row.timestamp,
        status: row.readAt ? 'read' : 'sent',
      }));

    return { items, meta: buildPaginationMeta(page, pageSize, totalItems) };
  },

  /** Persists a chat message. Used by the Socket.IO `send_message` handler. */
  async saveMessage(senderId: string, receiverId: string, text: string) {
    const chatId = computeChatId(senderId, receiverId);

    const message = await prisma.message.create({
      data: { senderId, receiverId, chatId, message: text },
    });

    return {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      text: message.message,
      createdAt: message.timestamp,
      status: 'sent' as const,
    };
  },

  async markRead(chatId: string, userId: string) {
    await prisma.message.updateMany({
      where: { chatId, receiverId: userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { message: 'Messages marked as read.' };
  },
};
