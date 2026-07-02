import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default database values...');

  // 1. Seed Repositories
  const repositories = [
    { name: 'Core', gitUrl: 'https://github.com/quocanhDev99/release_flow_platform_core.git' },
    { name: 'E-com', gitUrl: 'https://github.com/quocanhDev99/release_flow_platform_ecom.git' },
  ];

  for (const repo of repositories) {
    const existing = await prisma.repository.findUnique({
      where: { name: repo.name },
    });
    if (!existing) {
      await prisma.repository.create({ data: repo });
      console.log(`Created Repository: ${repo.name}`);
    }
  }

  // 2. Seed Environments
  const environments = [
    { name: 'dev', description: 'Môi trường phát triển cục bộ của lập trình viên' },
    { name: 'devel', description: 'Môi trường tích hợp mã nguồn chung (Development server)' },
    { name: 'STG', description: 'Môi trường mô phỏng Production (Staging server)' },
    { name: 'UAT', description: 'Môi trường nghiệm thu nghiệp vụ khách hàng (UAT server)' },
    { name: 'Production', description: 'Môi trường chạy thật của sản phẩm (Live production)' },
  ];

  for (const env of environments) {
    const existing = await prisma.environment.findUnique({
      where: { name: env.name },
    });
    if (!existing) {
      await prisma.environment.create({ data: env });
      console.log(`Created Environment: ${env.name}`);
    }
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
