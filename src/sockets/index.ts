import { IncomingMessage, Server as HttpServer, ServerResponse } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { setIO } from './io';
import { SOCKET_EVENTS, rooms } from './events';
import { messagesService } from '../modules/messages/messages.service';
import { Role } from '@prisma/client';

interface SocketUser {
  id: string;
  role: Role;
}

declare module 'socket.io' {
  interface Socket {
    user?: SocketUser;
  }
}

export const initSockets = (httpServer: HttpServer): Server => {
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

  const io = new Server(httpServer, {
    path: '/socket.io/',
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    cors: {
      origin: (origin: string | undefined, callback: (err: Error | null, allow: boolean) => void) => {
        if (!origin) return callback(null, true);
        const normalized = origin.toLowerCase();
        if (allowedOrigins.some((o) => o.toLowerCase() === normalized)) return callback(null, true);
        if (normalized.startsWith('exp://')) return callback(null, true);
        logger.warn('[Socket CORS] Blocked origin', { origin });
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
    },
  });

  if (!env.isProduction) {
    io.engine.use((req: IncomingMessage, _res: ServerResponse, next: (err?: unknown) => void) => {
      logger.info('ENGINE REQUEST', {
        url: req.url,
        method: req.method,
        origin: req.headers.origin,
      });
      next();
    });

    io.engine.on('connection', (socket) => {
      logger.info(`ENGINE CONNECTION socket=${socket.id}`);
    });
  }

  io.on('connect_error', (err: Error) => {
    logger.error('Socket connect_error', { message: err.message });
  });

  // ── Authenticated handshake ─────────────────────────────────────────
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization?.replace('Bearer ', '') as string | undefined);

    if (!token) {
      logger.warn('Socket auth failed: missing token', { socketId: socket.id });
      return next(new Error('Authentication required.'));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.user = { id: payload.sub, role: payload.role };
      next();
    } catch (err) {
      if ((err as { name?: string })?.name === 'TokenExpiredError') {
        logger.warn('Socket auth failed: expired token', { socketId: socket.id });
        return next(new Error('Token expired.'));
      }
      logger.warn('Socket auth failed: invalid token', { socketId: socket.id });
      next(new Error('Invalid token.'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.user;
    if (!user) {
      logger.warn('Socket connected without user, disconnecting', { socketId: socket.id });
      socket.disconnect(true);
      return;
    }

    logger.info(`Socket connected: user=${user.id} role=${user.role} socket=${socket.id}`);

    // Every user gets a personal room for direct notifications
    // (bookings, verification updates, etc.)
    socket.join(rooms.user(user.id));

    if (user.role === 'admin' || user.role === 'super_admin') {
      socket.join(rooms.admins());
    }

    // ── Chat: join/leave conversation rooms ───────────────────────────
    socket.on(SOCKET_EVENTS.JOIN_CHAT, ({ chatId }: { chatId: string }) => {
      if (typeof chatId === 'string') {
        socket.join(rooms.chat(chatId));
      }
    });

    socket.on(SOCKET_EVENTS.LEAVE_CHAT, ({ chatId }: { chatId: string }) => {
      if (typeof chatId === 'string') {
        socket.leave(rooms.chat(chatId));
      }
    });

    // ── Chat: send message ─────────────────────────────────────────────
    socket.on(
      SOCKET_EVENTS.SEND_MESSAGE,
      async (payload: { chatId: string; text: string; receiverId?: string }) => {
        try {
          const { chatId, text } = payload;
          if (!chatId || !text?.trim()) return;

          // Determine receiver: either provided explicitly, or derived
          // from the chatId (which encodes both participant ids).
          const parts = chatId.split('_');
          const receiverId =
            payload.receiverId ?? parts.find((id) => id !== user.id) ?? parts[0];

          if (!receiverId) return;

          const message = await messagesService.saveMessage(user.id, receiverId, text.trim());

          // Broadcast to the chat room (both participants, if joined)
          io.to(rooms.chat(chatId)).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, message);

          // Also notify the receiver's personal room in case they haven't
          // joined the chat room yet (e.g. chat list screen).
          io.to(rooms.user(receiverId)).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, message);
        } catch (error) {
          logger.error('send_message handler failed', error);
        }
      }
    );

    // ── Chat: typing indicator ──────────────────────────────────────────
    socket.on(
      SOCKET_EVENTS.TYPING_INDICATOR,
      (payload: { chatId: string; isTyping: boolean }) => {
        if (!payload?.chatId) return;
        socket.to(rooms.chat(payload.chatId)).emit(SOCKET_EVENTS.TYPING_INDICATOR, {
          chatId: payload.chatId,
          userId: user.id,
          isTyping: !!payload.isTyping,
        });
      }
    );

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      logger.info(`Socket disconnected: user=${user.id} socket=${socket.id} reason=${reason}`);
    });
  });

  setIO(io);
  return io;
};
