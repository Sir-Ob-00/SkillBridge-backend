import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export const setIO = (io: Server): void => {
  ioInstance = io;
};

export const getIO = (): Server | null => ioInstance;

/**
 * Emits an event to a specific user's personal room (`user:<userId>`).
 * Safe to call even if Socket.IO hasn't initialized yet (no-op).
 */
export const emitToUser = (userId: string, event: string, payload: unknown): void => {
  ioInstance?.to(`user:${userId}`).emit(event, payload);
};

/** Emits an event to all connected admin sockets. */
export const emitToAdmins = (event: string, payload: unknown): void => {
  ioInstance?.to('admins').emit(event, payload);
};

/** Emits an event to a chat room. */
export const emitToChat = (chatId: string, event: string, payload: unknown): void => {
  ioInstance?.to(`chat:${chatId}`).emit(event, payload);
};
