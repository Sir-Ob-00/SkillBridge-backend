import { Role, ApplicationStatus, VerificationReviewStatus } from '@prisma/client';
import { prisma } from '../src/config/prisma';
import { hashPassword } from '../src/utils/password';
import { DEFAULT_CATEGORIES } from '../src/modules/categories/categories.service';

async function main() {
  console.log('Seeding categories...');
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((name) => ({ name })),
    skipDuplicates: true,
  });

  console.log('Seeding admin user...');
  const adminPassword = await hashPassword('Admin123!');
  await prisma.user.upsert({
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

  console.log('Seeding sample artisan (approved)...');
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
      applicationStatus: ApplicationStatus.ACTIVE,
      verification: 'verified',
      submittedAt: new Date('2025-01-01'),
      reviewedAt: new Date('2025-01-02'),
      reviewedByAdminId: (await prisma.user.findUnique({ where: { email: 'admin@skillbridge.dev' } }))!.id,
    },
  });

  await prisma.artisanSkill.createMany({
    data: [
      { artisanProfileId: artisanProfile.id, name: 'Haircuts' },
      { artisanProfileId: artisanProfile.id, name: 'Beard trimming' },
      { artisanProfileId: artisanProfile.id, name: 'Hair styling' },
    ],
    skipDuplicates: true,
  });

  const barberingCategory = await prisma.category.findFirst({ where: { name: 'Barbering' } });
  if (barberingCategory) {
    await prisma.artisanCategory.createMany({
      data: [{ artisanProfileId: artisanProfile.id, categoryId: barberingCategory.id }],
      skipDuplicates: true,
    });
  }

  await prisma.artisanAvailability.createMany({
    data: [
      { artisanProfileId: artisanProfile.id, day: 'MONDAY', startTime: '09:00', endTime: '17:00' },
      { artisanProfileId: artisanProfile.id, day: 'TUESDAY', startTime: '09:00', endTime: '17:00' },
      { artisanProfileId: artisanProfile.id, day: 'WEDNESDAY', startTime: '09:00', endTime: '17:00' },
      { artisanProfileId: artisanProfile.id, day: 'THURSDAY', startTime: '09:00', endTime: '17:00' },
      { artisanProfileId: artisanProfile.id, day: 'FRIDAY', startTime: '09:00', endTime: '17:00' },
    ],
    skipDuplicates: true,
  });

  await prisma.artisanVerification.upsert({
    where: { artisanProfileId: artisanProfile.id },
    update: {},
    create: {
      artisanProfileId: artisanProfile.id,
      institution: 'KNUST',
      studentIdNumber: 'STU-2024-001',
      verificationImageUrl: 'https://example.com/verification.jpg',
      reviewStatus: VerificationReviewStatus.APPROVED,
      reviewedAt: new Date('2025-01-02'),
      reviewedByUserId: (await prisma.user.findUnique({ where: { email: 'admin@skillbridge.dev' } }))!.id,
    },
  });

  console.log('Seeding sample service...');
  await prisma.artisanService.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      artisanProfileId: artisanProfile.id,
      title: 'Classic Haircut',
      description: 'A clean, classic haircut tailored to your style.',
      price: 25,
      durationMinutes: 30,
      categoryName: 'Barbering',
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
