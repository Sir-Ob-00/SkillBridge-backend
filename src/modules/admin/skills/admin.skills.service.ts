import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../utils/ApiError';
import { CreateSkillInput, UpdateSkillInput, ListSkillsQuery } from './admin.skills.validators';

export const adminSkillsService = {
  async list(query: ListSkillsQuery) {
    return prisma.skill.findMany({
      where: {
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.activeOnly ? { active: true } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string) {
    const skill = await prisma.skill.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!skill) {
      throw ApiError.notFound('Skill not found.');
    }
    return skill;
  },

  async create(input: CreateSkillInput) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    const existing = await prisma.skill.findUnique({
      where: { skill_name_categoryId_key: { name: input.name, categoryId: input.categoryId } },
    });
    if (existing) {
      throw ApiError.conflict('A skill with this name already exists in the selected category.');
    }

    return prisma.skill.create({
      data: { name: input.name, categoryId: input.categoryId, active: input.active ?? true },
    });
  },

  async update(id: string, input: UpdateSkillInput) {
    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      throw ApiError.notFound('Skill not found.');
    }

    if (input.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!category) {
        throw ApiError.notFound('Category not found.');
      }
    }

    if (input.name || input.categoryId) {
      const name = input.name ?? skill.name;
      const categoryId = input.categoryId ?? skill.categoryId;
      if (categoryId) {
        const clash = await prisma.skill.findUnique({
          where: { skill_name_categoryId_key: { name, categoryId } },
        });
        if (clash && clash.id !== id) {
          throw ApiError.conflict('A skill with this name already exists in the selected category.');
        }
      }
    }

    return prisma.skill.update({ where: { id }, data: input });
  },

  async remove(id: string) {
    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      throw ApiError.notFound('Skill not found.');
    }

    await prisma.skill.delete({ where: { id } });
    return { message: 'Skill deleted.' };
  },
};
