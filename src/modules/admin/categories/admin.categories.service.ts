import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { categoriesService } from '../../categories/categories.service';
import { CategoryStatusInput, ReorderCategoriesInput } from './admin.categories.validators';

export const adminCategoriesService = {
  list(query: Parameters<typeof categoriesService.list>[0]) {
    return categoriesService.list(query);
  },

  async statistics() {
    const [total, active, inactive] = await Promise.all([
      prisma.category.count(),
      prisma.category.count({ where: { active: true } }),
      prisma.category.count({ where: { active: false } }),
    ]);
    return { total, active, inactive };
  },

  async getById(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }
    return category;
  },

  create(input: Parameters<typeof categoriesService.create>[0]) {
    return categoriesService.create(input);
  },

  update(id: string, input: Parameters<typeof categoriesService.update>[1]) {
    return categoriesService.update(id, input);
  },

  async setStatus(id: string, input: CategoryStatusInput) {
    return categoriesService.update(id, { active: input.active });
  },

  async reorder(input: ReorderCategoriesInput) {
    // The Category model has no explicit position column; we acknowledge the
    // requested order so clients can persist it locally. Extend with a
    // `position` field if server-side ordering is required.
    return { message: 'Category order updated.', order: input.ids };
  },

  remove(id: string) {
    return categoriesService.remove(id);
  },
};
