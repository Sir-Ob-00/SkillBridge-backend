/**
 * Computes a deterministic chat/conversation id for a 1:1 conversation
 * between two users, independent of argument order (e.g. "id1_id2" where
 * id1 < id2 lexicographically).
 */
export const computeChatId = (userIdA: string, userIdB: string): string => {
  return [userIdA, userIdB].sort().join('_');
};

/** Given a chatId (built by computeChatId) and the current user's id, returns the other participant's id. */
export const otherParticipant = (chatId: string, currentUserId: string): string | null => {
  const parts = chatId.split('_');
  if (parts.length !== 2) return null;

  const [a, b] = parts;
  if (a === currentUserId) return b;
  if (b === currentUserId) return a;
  return null;
};
