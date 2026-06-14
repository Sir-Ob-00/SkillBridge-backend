import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesQuery,
} from './categories.validators';

export const DEFAULT_CATEGORIES = [
  'Graphic Design',
  'Photography',
  'Barbering',
  'Makeup',
  'Tailoring',
  'Laptop Repair',
  'Phone Repair',
  'Tutoring',
  'Event Decoration',
];

export const categoriesService = {
  async list(query: ListCategoriesQuery) {
    return prisma.category.findMany({
      where: query.activeOnly ? { active: true } : {},
      orderBy: { name: 'asc' },
    });
  },

  async create(input: CreateCategoryInput) {
    const existing = await prisma.category.findUnique({ where: { name: input.name } });
    if (existing) {
      throw ApiError.conflict('A category with this name already exists.');
    }

    return prisma.category.create({ data: { name: input.name } });
  },

  async update(id: string, input: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    return prisma.category.update({ where: { id }, data: input });
  },

  async remove(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    await prisma.category.delete({ where: { id } });
    return { message: 'Category deleted.' };
  },

  /** Seeds the default category list if the table is empty. */
  async ensureDefaults() {
    const count = await prisma.category.count();
    if (count > 0) return;

    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((name) => ({ name })),
      skipDuplicates: true,
    });
  },
};
