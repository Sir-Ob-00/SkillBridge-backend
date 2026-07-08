import { Role, ApplicationStatus, VerificationReviewStatus } from '@prisma/client';
import { prisma } from '../src/config/prisma';
import { hashPassword } from '../src/utils/password';
import { DEFAULT_CATEGORIES } from '../src/modules/categories/categories.service';
import { DEFAULT_SKILLS } from '../src/modules/skills/skills.service';

async function main() {
  console.log('Seeding categories...');
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((name) => ({ name })),
    skipDuplicates: true,
  });

  console.log('Seeding skills...');
  await prisma.skill.createMany({
    data: DEFAULT_SKILLS.map((name) => ({ name })),
    skipDuplicates: true,
  });

  console.log('Seeding admin user...');
  const adminPassword = await hashPassword('Admin123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@skillbridge.dev' },
    update: {},
    create: {
      name: 'SkillBridge Admin',
      email: 'admin@skillbridge.dev',
      password: adminPassword,
      role: Role.super_admin,
    },
  });

  console.log('Seeding sample student...');
  const studentPassword = await hashPassword('Student123!');
  const student = await prisma.user.upsert({
    where: { email: 'student@skillbridge.dev' },
    update: {},
    create: {
      name: 'Ama Owusu',
      email: 'student@skillbridge.dev',
      password: studentPassword,
      role: Role.student,
    },
  });
  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: { userId: student.id, campus: 'KNUST' },
  });

  console.log('Seeding sample artisan...');
  const artisanPassword = await hashPassword('Artisan123!');
  const artisanUser = await prisma.user.upsert({
    where: { email: 'artisan@skillbridge.dev' },
    update: {},
    create: {
      name: 'Kofi Mensah',
      email: 'artisan@skillbridge.dev',
      password: artisanPassword,
      role: Role.artisan,
    },
  });

  const artisanProfile = await prisma.artisanProfile.upsert({
    where: { userId: artisanUser.id },
    update: {},
    create: {
      userId: artisanUser.id,
      businessName: "Kofi's Barber Shop",
      bio: 'Professional campus barber with 5+ years of experience.',
      pricingFrom: 20,
      location: 'Near Unity Hall',
      yearsOfExperience: 5,
      status: ApplicationStatus.ACTIVE,
    },
  });

  await prisma.artisanSkill.createMany({
    data: [
      { artisanId: artisanProfile.id, name: 'Haircuts' },
      { artisanId: artisanProfile.id, name: 'Beard trimming' },
    ],
    skipDuplicates: true,
  });

  await prisma.artisanCategory.createMany({
    data: [{ artisanId: artisanProfile.id, name: 'Barbering' }],
    skipDuplicates: true,
  });

  await prisma.artisanVerification.upsert({
    where: { artisanId: artisanProfile.id },
    update: {},
    create: {
      artisanId: artisanProfile.id,
      institution: 'KNUST',
      studentIdNumber: 'KTU/2021/001',
      verificationImageUrl: 'https://res.cloudinary.com/demo/image/upload/sample',
      reviewStatus: VerificationReviewStatus.APPROVED,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
  });

  console.log('Seeding sample service...');
  await prisma.artisanService.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      artisanId: artisanProfile.id,
      title: 'Classic Haircut',
      description: 'A clean, classic haircut tailored to your style.',
      price: 25,
      durationMinutes: 30,
      category: 'Barbering',
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
