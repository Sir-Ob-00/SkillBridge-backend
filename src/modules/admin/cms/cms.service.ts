export const cmsService = {
  async list(query: { page: number; pageSize: number }) {
    return {
      items: [],
      meta: { page: query.page, pageSize: query.pageSize, totalItems: 0, totalPages: 0 },
    };
  },

  async create(data: Record<string, any>) {
    return { id: Math.random().toString(36).slice(2), ...data };
  },

  async update(id: string, data: Record<string, any>) {
    return { id, ...data };
  },

  async remove(id: string) {
    return null;
  },
};
