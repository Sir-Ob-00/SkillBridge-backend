// Clear a user from the database (cascades profile, tokens).
//
// Usage:
//   npx tsx clearuser.ts                 -> lists all users (safe, no deletes)
//   npx tsx clearuser.ts user@example.com -> deletes that user and related records
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const email = process.argv[2];

async function main() {
  if (!email) {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`Found ${users.length} user(s):`);
    for (const u of users) {
      console.log(`- ${u.email} | role=${u.role} | id=${u.id}`);
    }
    console.log('\nRun with an email to delete, e.g.: npx tsx clearuser.ts user@example.com');
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`No user found with email: ${email}`);
    return;
  }

  // Cascade removes artisanProfile/studentProfile, refreshTokens,
  // passwordResetTokens, etc.
  await prisma.user.delete({ where: { id: user.id } });
  console.log(`Deleted user: ${email} (id=${user.id}) and all related records.`);
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
