export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Chat
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  TYPING_INDICATOR: 'typing_indicator',
  JOIN_CHAT: 'join_chat',
  LEAVE_CHAT: 'leave_chat',
  MESSAGE_READ: 'message_read',

  // Booking updates
  BOOKING_CREATED: 'booking_created',
  BOOKING_ACCEPTED: 'booking_accepted',
  BOOKING_COMPLETED: 'booking_completed',
  BOOKING_CANCELLED: 'booking_cancelled',

  // Admin realtime
  ARTISAN_VERIFIED: 'artisan_verified',
  REPORT_SUBMITTED: 'report_submitted',
  REVIEW_FLAGGED: 'review_flagged',

  // Admin-initiated notifications
  NOTIFICATION_SENT: 'notification_sent',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

/** Room naming helpers keep room conventions consistent across the app. */
export const rooms = {
  user: (userId: string) => `user:${userId}`,
  chat: (chatId: string) => `chat:${chatId}`,
  admins: () => 'admins',
};
