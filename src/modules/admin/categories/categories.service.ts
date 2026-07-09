import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';

export const categoriesService = {
  async list() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  },

  async create(data: { name: string; active?: boolean }) {
    return prisma.category.create({ data: { name: data.name, active: data.active ?? true } });
  },

  async update(id: string, data: { name?: string; active?: boolean }) {
    return prisma.category.update({ where: { id }, data });
  },

  async remove(id: string) {
    return prisma.category.delete({ where: { id } });
  },
};
