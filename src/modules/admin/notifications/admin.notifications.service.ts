import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { emitToUser, emitToAdmins } from '../../../sockets/io';
import { SOCKET_EVENTS } from '../../../sockets/events';
import { CreateNotificationInput } from './admin.notifications.validators';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  targetUserId?: string;
  targetRole?: Role;
  createdBy: string;
  createdAt: string;
}

/**
 * Notifications are currently realtime-only (emitted over Socket.IO) and kept
 * in an in-memory log for audit/display. A persistent `Notification` model +
 * migration can be added later if durable storage is required.
 */
const store: NotificationRecord[] = [];

export const adminNotificationsService = {
  list(): NotificationRecord[] {
    return [...store].reverse();
  },

  create(createdBy: string, input: CreateNotificationInput): NotificationRecord {
    const record: NotificationRecord = {
      id: randomUUID(),
      title: input.title,
      message: input.message,
      targetUserId: input.targetUserId,
      targetRole: input.targetRole,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    store.push(record);

    if (input.targetUserId) {
      emitToUser(input.targetUserId, SOCKET_EVENTS.NOTIFICATION_SENT, record);
    } else if (input.targetRole) {
      // Broadcast to all connected admins of the given role.
      emitToAdmins(SOCKET_EVENTS.NOTIFICATION_SENT, record);
    } else {
      emitToAdmins(SOCKET_EVENTS.NOTIFICATION_SENT, record);
    }

    return record;
  },
};
