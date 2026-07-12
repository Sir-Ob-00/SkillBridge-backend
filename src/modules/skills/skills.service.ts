import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

/** Master categories (used to seed the category catalog). */
export const DEFAULT_CATEGORIES = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Welder',
  'Mason',
  'Tailor / Fashion Designer',
  'Hair Stylist / Barber',
  'Makeup Artist',
  'AC & Refrigeration Technician',
  'Phone / Computer Technician',
  'Auto Mechanic',
];

/** Master skill list grouped by category (used to seed the skill catalog). */
export const DEFAULT_SKILLS_BY_CATEGORY: { category: string; skills: string[] }[] = [
  {
    category: 'Electrician',
    skills: [
      'Residential Wiring',
      'Commercial Wiring',
      'Fault Diagnosis',
      'Circuit Breaker Installation',
      'Lighting Installation',
      'Socket & Switch Installation',
      'Ceiling Fan Installation',
      'Solar Panel Installation',
      'Generator Changeover Installation',
      'Electrical Maintenance',
    ],
  },
  {
    category: 'Plumber',
    skills: [
      'Pipe Installation',
      'Pipe Repair',
      'Leak Detection',
      'Drain Unblocking',
      'Water Heater Installation',
      'Bathroom Plumbing',
      'Kitchen Plumbing',
      'Pump Installation',
      'Borehole Plumbing',
      'General Plumbing Maintenance',
    ],
  },
  {
    category: 'Carpenter',
    skills: [
      'Furniture Making',
      'Cabinet Installation',
      'Roofing',
      'Door Installation',
      'Window Installation',
      'Wood Finishing',
      'Shelving',
      'Office Furniture',
      'Interior Woodwork',
      'Repairs & Maintenance',
    ],
  },
  {
    category: 'Painter',
    skills: [
      'Interior Painting',
      'Exterior Painting',
      'Spray Painting',
      'Decorative Painting',
      'Wall Preparation',
      'Wallpaper Installation',
      'Texture Finishing',
      'Ceiling Painting',
      'Wood Painting',
      'Metal Painting',
    ],
  },
  {
    category: 'Welder',
    skills: [
      'Arc Welding',
      'MIG Welding',
      'TIG Welding',
      'Metal Fabrication',
      'Gate Fabrication',
      'Burglar Proof Installation',
      'Stainless Steel Fabrication',
      'Aluminium Fabrication',
      'Structural Welding',
      'Welding Repairs',
    ],
  },
  {
    category: 'Mason',
    skills: [
      'Bricklaying',
      'Block Work',
      'Concrete Work',
      'Tiling',
      'Plastering',
      'Screeding',
      'Foundation Construction',
      'Stone Masonry',
      'Retaining Walls',
      'General Masonry',
    ],
  },
  {
    category: 'Tailor / Fashion Designer',
    skills: [
      "Men's Wear",
      "Women's Wear",
      'School Uniforms',
      'Bridal Wear',
      'Suit Making',
      'Dress Alteration',
      'Embroidery',
      'Pattern Drafting',
      'Fashion Consultation',
      'Clothing Repairs',
    ],
  },
  {
    category: 'Hair Stylist / Barber',
    skills: [
      'Hair Cutting',
      'Hair Braiding',
      'Hair Coloring',
      'Hair Relaxing',
      'Hair Treatment',
      'Wig Installation',
      'Dreadlocks',
      'Beard Grooming',
      "Children's Haircuts",
      'Bridal Hair Styling',
    ],
  },
  {
    category: 'Makeup Artist',
    skills: [
      'Bridal Makeup',
      'Event Makeup',
      'Photoshoot Makeup',
      'Special Effects Makeup',
      'Facial Grooming',
      'Eyebrow Shaping',
      'Eyelash Installation',
      'Gele Tying',
      'Makeup Consultation',
      'Skincare Preparation',
    ],
  },
  {
    category: 'AC & Refrigeration Technician',
    skills: [
      'AC Installation',
      'AC Servicing',
      'Gas Refilling',
      'Refrigeration Repair',
      'Cold Room Maintenance',
      'Thermostat Replacement',
      'Compressor Repair',
      'Fault Diagnosis',
      'Preventive Maintenance',
      'General HVAC Repairs',
    ],
  },
  {
    category: 'Phone / Computer Technician',
    skills: [
      'Phone Screen Replacement',
      'Phone Software Repair',
      'Laptop Repair',
      'Desktop Repair',
      'Virus Removal',
      'Operating System Installation',
      'Data Recovery',
      'Hardware Upgrade',
      'Networking',
      'Printer Setup',
    ],
  },
  {
    category: 'Auto Mechanic',
    skills: [
      'Engine Repair',
      'Brake Service',
      'Suspension Repair',
      'Oil Change',
      'Transmission Repair',
      'Electrical Diagnostics',
      'Battery Replacement',
      'Air Conditioning Repair',
      'Vehicle Inspection',
      'General Maintenance',
    ],
  },
];

export const skillsService = {
  /** Returns active skills, optionally filtered by categoryId. */
  async list(opts: { categoryId?: string } = {}) {
    return prisma.skill.findMany({
      where: {
        active: true,
        ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
      },
      orderBy: { name: 'asc' },
    });
  },

  /** Returns active skills that belong to a given category. */
  async listByCategory(categoryId: string) {
    return prisma.skill.findMany({
      where: { categoryId, active: true },
      orderBy: { name: 'asc' },
    });
  },

  /** Ensures the master categorized skill list exists (idempotent). */
  async ensureDefaults() {
    for (const group of DEFAULT_SKILLS_BY_CATEGORY) {
      const category = await prisma.category.findUnique({ where: { name: group.category } });
      if (!category) continue;

      for (const name of group.skills) {
        await prisma.skill.upsert({
          where: { name },
          update: { categoryId: category.id, active: true },
          create: { name, categoryId: category.id },
        });
      }
    }
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
