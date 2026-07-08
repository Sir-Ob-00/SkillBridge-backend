import { categoriesService } from '../../categories/categories.service';

export const adminCategoriesService = {
  list(query: Parameters<typeof categoriesService.list>[0]) {
    return categoriesService.list(query);
  },
  create(input: Parameters<typeof categoriesService.create>[0]) {
    return categoriesService.create(input);
  },
  update(id: string, input: Parameters<typeof categoriesService.update>[1]) {
    return categoriesService.update(id, input);
  },
  remove(id: string) {
    return categoriesService.remove(id);
  },
};
