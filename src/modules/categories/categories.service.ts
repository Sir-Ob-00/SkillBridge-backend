import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../utils/ApiError';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesQuery,
} from './categories.validators';
import { DEFAULT_CATEGORIES, skillsService } from '../skills/skills.service';

export const categoriesService = {
  async list(query: ListCategoriesQuery) {
    const where: Prisma.CategoryWhereInput = {};
    if (query.activeOnly) where.active = true;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    return prisma.category.findMany({
      where,
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

  /** Returns the active skills that belong to a category. */
  async getSkills(categoryId: string) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    return skillsService.listByCategory(categoryId);
  },

  /** Seeds the master category list (idempotent). */
  async ensureDefaults() {
    await Promise.all(
      DEFAULT_CATEGORIES.map((name) =>
        prisma.category.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      )
    );
  },
};
