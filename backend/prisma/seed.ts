import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default database values...');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Seed Repositories
  const repoCore = await prisma.repository.upsert({
    where: { name: 'Core' },
    update: {},
    create: {
      name: 'Core',
      gitUrl: 'https://github.com/quocanhDev99/release_flow_platform_core.git',
    },
  });

  const repoEcom = await prisma.repository.upsert({
    where: { name: 'E-com' },
    update: {},
    create: {
      name: 'E-com',
      gitUrl: 'https://github.com/quocanhDev99/release_flow_platform_ecom.git',
    },
  });

  const repoCms = await prisma.repository.upsert({
    where: { name: 'CMS' },
    update: {},
    create: {
      name: 'CMS',
      gitUrl: 'https://github.com/quocanhDev99/release_flow_platform_cms.git',
    },
  });

  const repoMarketing = await prisma.repository.upsert({
    where: { name: 'E-marketing' },
    update: {},
    create: {
      name: 'E-marketing',
      gitUrl: 'https://github.com/quocanhDev99/release_flow_platform_emarketing.git',
    },
  });

  const repoPromotion = await prisma.repository.upsert({
    where: { name: 'Promotion' },
    update: {},
    create: {
      name: 'Promotion',
      gitUrl: 'https://github.com/quocanhDev99/release_flow_platform_promotion.git',
    },
  });

  console.log('Seed Repositories completed.');

  // 2. Seed Environments
  const envs = [
    { name: 'dev', description: 'Môi trường phát triển cục bộ của lập trình viên' },
    { name: 'devel', description: 'Môi trường tích hợp mã nguồn chung (Development server)' },
    { name: 'STG', description: 'Môi trường mô phỏng Production (Staging server)' },
    { name: 'UAT', description: 'Môi trường nghiệm thu nghiệp vụ khách hàng (UAT server)' },
    { name: 'Production', description: 'Môi trường chạy thật của sản phẩm (Live production)' },
  ];

  const createdEnvs: Record<string, any> = {};
  for (const env of envs) {
    const dbEnv = await prisma.environment.upsert({
      where: { name: env.name },
      update: {},
      create: env,
    });
    createdEnvs[env.name] = dbEnv;
  }
  console.log('Seed Environments completed.');

  // 3. Seed Users
  const userJohn = await prisma.user.upsert({
    where: { username: 'john_doe' },
    update: { password: defaultPassword },
    create: {
      username: 'john_doe',
      email: 'john@example.com',
      password: defaultPassword,
    },
  });

  const userAlice = await prisma.user.upsert({
    where: { username: 'alice_smith' },
    update: { password: defaultPassword },
    create: {
      username: 'alice_smith',
      email: 'alice@example.com',
      password: defaultPassword,
    },
  });
  console.log('Seed Users completed.');

  // 4. Seed Release Packages
  const release112 = await prisma.releasePackage.upsert({
    where: { version: 'v1.12.0' },
    update: {},
    create: {
      version: 'v1.12.0',
      status: 'active',
      buildArtifactHash: 'sha256:d8c07e0f2fcd1b9d4e5f7a0774a3f124619d80d2919d7e5f1b9f7a0b3f81e3ad',
    },
  });

  const release113 = await prisma.releasePackage.upsert({
    where: { version: 'v1.13.0' },
    update: {},
    create: {
      version: 'v1.13.0',
      status: 'draft',
    },
  });
  console.log('Seed Release Packages completed.');

  // 5. Seed Tickets (Independent since it is Many-to-Many)
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketId: 'MAG-20479',
      summary: 'Sửa lỗi hiển thị nút đăng nhập trên mobile',
      changeType: 'Fix bug',
      qcStatus: 'Passed',
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      ticketId: 'MAG-20550',
      summary: 'Tối ưu hóa thời gian tải giỏ hàng',
      changeType: 'Enhance',
      qcStatus: 'Ready',
      pendingIssues: 'Cần tối ưu thêm các câu lệnh SQL query',
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      ticketId: 'MAG-20600',
      summary: 'Tích hợp đăng nhập một lần SSO',
      changeType: 'Feature',
      qcStatus: 'Waiting',
    },
  });
  console.log('Seed Tickets completed.');

  // 6. Seed Deployment Items
  // Clear old items to avoid duplicates
  await prisma.deploymentItem.deleteMany({});

  const item1 = await prisma.deploymentItem.create({
    data: {
      sourceBranch: 'feature/MAG-20479-auth-fix',
      status: 'merged',
      isMergedOnDevel: true,
      repositoryId: repoCore.id,
      userId: userJohn.id,
      releasePackageId: release112.id,
      tickets: {
        connect: [{ id: ticket1.id }],
      },
      builds: {
        create: [
          {
            buildNumber: '101',
            buildUrl: 'https://jenkins.example.com/job/core-dev/101/',
            status: 'SUCCESS',
            environmentId: createdEnvs['dev'].id,
          },
          {
            buildNumber: '102',
            buildUrl: 'https://jenkins.example.com/job/core-devel/102/',
            status: 'SUCCESS',
            environmentId: createdEnvs['devel'].id,
          },
        ],
      },
    },
  });

  const item2 = await prisma.deploymentItem.create({
    data: {
      sourceBranch: 'feature/MAG-20550-cart-optimize',
      status: 'merged',
      isMergedOnDevel: false,
      repositoryId: repoEcom.id,
      userId: userAlice.id,
      releasePackageId: release112.id,
      tickets: {
        connect: [{ id: ticket2.id }],
      },
      builds: {
        create: [
          {
            buildNumber: '55',
            buildUrl: 'https://jenkins.example.com/job/ecom-dev/55/',
            status: 'SUCCESS',
            environmentId: createdEnvs['dev'].id,
          },
        ],
      },
    },
  });

  const item3 = await prisma.deploymentItem.create({
    data: {
      sourceBranch: 'feature/MAG-20600-sso-support',
      status: 'merged',
      isMergedOnDevel: false,
      repositoryId: repoCore.id,
      userId: userJohn.id,
      releasePackageId: release113.id,
      tickets: {
        connect: [{ id: ticket3.id }],
      },
    },
  });
  console.log('Seed Deployment Items and Builds completed.');

  // 7. Seed Deployment Policies
  const uatPolicy = await prisma.deploymentPolicy.upsert({
    where: { name: 'UAT Weekly Deployment Policy' },
    update: {},
    create: {
      name: 'UAT Weekly Deployment Policy',
      cronSchedule: '0 18 * * 5', // Friday 6:00 PM
      targetEnvironment: 'UAT',
      capacityLimit: 30,
      freezeWindow: 4,
    },
  });

  const prodPolicy = await prisma.deploymentPolicy.upsert({
    where: { name: 'Prod Weekly Deployment Policy' },
    update: {},
    create: {
      name: 'Prod Weekly Deployment Policy',
      cronSchedule: '0 22 * * 1', // Monday 10:00 PM
      targetEnvironment: 'Production',
      capacityLimit: 20,
      freezeWindow: 24,
    },
  });
  console.log('Seed Deployment Policies completed.');

  // 8. Seed Deployment Windows
  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 + 7 - nextFriday.getDay()) % 7));
  nextFriday.setHours(18, 0, 0, 0);

  const uatWindow = await prisma.deploymentWindow.create({
    data: {
      startTime: nextFriday,
      endTime: new Date(nextFriday.getTime() + 4 * 60 * 60 * 1000), // +4 hours
      freezeTime: new Date(nextFriday.getTime() - 4 * 60 * 60 * 1000), // -4 hours
      capacity: 30,
      status: 'open',
      policyId: uatPolicy.id,
      environmentId: createdEnvs['UAT'].id,
    },
  });

  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7));
  nextMonday.setHours(22, 0, 0, 0);

  const prodWindow = await prisma.deploymentWindow.create({
    data: {
      startTime: nextMonday,
      endTime: new Date(nextMonday.getTime() + 4 * 60 * 60 * 1000), // +4 hours
      freezeTime: new Date(nextMonday.getTime() - 24 * 60 * 60 * 1000), // -24 hours
      capacity: 20,
      status: 'open',
      policyId: prodPolicy.id,
      environmentId: createdEnvs['Production'].id,
    },
  });
  console.log('Seed Deployment Windows completed.');

  // 9. Seed Deployment Bookings
  await prisma.deploymentBooking.create({
    data: {
      releasePackageId: release112.id,
      deploymentWindowId: uatWindow.id,
      status: 'approved',
    },
  });

  await prisma.deploymentBooking.create({
    data: {
      releasePackageId: release112.id,
      deploymentWindowId: prodWindow.id,
      status: 'pending',
    },
  });
  console.log('Seed Deployment Bookings completed.');

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
