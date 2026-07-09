export const notificationsService = {
  async list() {
    return [];
  },

  async create(data: Record<string, any>) {
    return {
      id: Math.random().toString(36).slice(2),
      ...data,
      sentAt: new Date().toISOString(),
    };
  },
};
