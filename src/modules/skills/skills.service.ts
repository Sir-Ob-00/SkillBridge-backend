import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

export const DEFAULT_SKILLS = [
  'Haircuts',
  'Beard trimming',
  'Hair styling',
  'Makeup',
  'Photography',
  'Graphic Design',
  'Tailoring',
  'Laptop Repair',
  'Phone Repair',
  'Tutoring',
  'Event Decoration',
  'Braiding',
  'Nail Care',
  'Barbering',
];

export const skillsService = {
  async list() {
    return prisma.skill.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  },

  async ensureDefaults() {
    const count = await prisma.skill.count();
    if (count > 0) return;

    await prisma.skill.createMany({
      data: DEFAULT_SKILLS.map((name) => ({ name })),
      skipDuplicates: true,
    });
  },

  /** Returns the set of catalog skill names (used for validation). */
  async activeNames(): Promise<Set<string>> {
    const rows = await prisma.skill.findMany({
      where: { active: true },
      select: { name: true },
    });
    return new Set(rows.map((r) => r.name));
  },

  async assertValid(names: string[]): Promise<void> {
    const valid = await this.activeNames();
    const invalid = names.filter((n) => !valid.has(n));
    if (invalid.length > 0) {
      throw ApiError.badRequest(`Unknown skill(s): ${invalid.join(', ')}`);
    }
  },
};
