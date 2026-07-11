import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { emitToUser, emitToAdmins } from '../sockets/io';
import { SOCKET_EVENTS } from '../sockets/events';

type NoticeType = 'info' | 'success' | 'warning' | 'error';

/** Persists + emits a notification to a single user (best-effort). */
export const notifyUser = async (
  userId: string,
  title: string,
  message: string,
  type: NoticeType = 'info'
) => {
  try {
    const record = await prisma.notification.create({
      data: { title, message, type, targetUserId: userId },
    });
    emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_SENT, record);
    return record;
  } catch (error) {
    console.error('[notify] failed to notify user:', error);
  }
};

/** Persists + emits a notification to all admins (best-effort). */
export const notifyAdmins = async (
  title: string,
  message: string,
  type: NoticeType = 'info'
) => {
  try {
    const record = await prisma.notification.create({
      data: { title, message, type, targetRole: Role.admin },
    });
    emitToAdmins(SOCKET_EVENTS.NOTIFICATION_SENT, record);
    return record;
  } catch (error) {
    console.error('[notify] failed to notify admins:', error);
  }
};
