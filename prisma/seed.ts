import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  await prisma.membershipPlan.upsert({
    where: { code: '30d' },
    create: {
      id: '00000000-0000-0000-0000-000000000030',
      code: '30d',
      name: '30天会员',
      durationDays: 30,
      priceCents: 2990,
      enabled: true,
      sortOrder: 1,
      description: '30天会员套餐',
    },
    update: {
      name: '30天会员',
      durationDays: 30,
      priceCents: 2990,
      enabled: true,
      sortOrder: 1,
      description: '30天会员套餐',
    },
  });

  await prisma.membershipPlan.upsert({
    where: { code: '365d' },
    create: {
      id: '00000000-0000-0000-0000-000000000365',
      code: '365d',
      name: '365天会员',
      durationDays: 365,
      priceCents: 19900,
      enabled: true,
      sortOrder: 2,
      description: '365天会员套餐',
    },
    update: {
      name: '365天会员',
      durationDays: 365,
      priceCents: 19900,
      enabled: true,
      sortOrder: 2,
      description: '365天会员套餐',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
