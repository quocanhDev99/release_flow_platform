"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding default database values...');
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
    console.log('Seed Repositories completed.');
    const envs = [
        { name: 'dev', description: 'Môi trường phát triển cục bộ của lập trình viên' },
        { name: 'devel', description: 'Môi trường tích hợp mã nguồn chung (Development server)' },
        { name: 'STG', description: 'Môi trường mô phỏng Production (Staging server)' },
        { name: 'UAT', description: 'Môi trường nghiệm thu nghiệp vụ khách hàng (UAT server)' },
        { name: 'Production', description: 'Môi trường chạy thật của sản phẩm (Live production)' },
    ];
    const createdEnvs = {};
    for (const env of envs) {
        const dbEnv = await prisma.environment.upsert({
            where: { name: env.name },
            update: {},
            create: env,
        });
        createdEnvs[env.name] = dbEnv;
    }
    console.log('Seed Environments completed.');
    const userJohn = await prisma.user.upsert({
        where: { username: 'john_doe' },
        update: {},
        create: {
            username: 'john_doe',
            email: 'john@example.com',
        },
    });
    const userAlice = await prisma.user.upsert({
        where: { username: 'alice_smith' },
        update: {},
        create: {
            username: 'alice_smith',
            email: 'alice@example.com',
        },
    });
    console.log('Seed Users completed.');
    const release112 = await prisma.releaseStream.upsert({
        where: { version: 'som/1.12.x' },
        update: {},
        create: {
            version: 'som/1.12.x',
            status: 'active',
        },
    });
    const release113 = await prisma.releaseStream.upsert({
        where: { version: 'som/1.13.0' },
        update: {},
        create: {
            version: 'som/1.13.0',
            status: 'active',
        },
    });
    console.log('Seed Release Streams completed.');
    await prisma.deploymentItem.deleteMany({});
    const item1 = await prisma.deploymentItem.create({
        data: {
            sourceBranch: 'feature/MAG-20479-auth-fix',
            status: 'merged',
            isMergedOnDevel: true,
            repositoryId: repoCore.id,
            userId: userJohn.id,
            releaseStreamId: release112.id,
            tickets: {
                create: [
                    {
                        ticketId: 'MAG-20479',
                        summary: 'Sửa lỗi hiển thị nút đăng nhập trên mobile',
                        changeType: 'Fix bug',
                        qcStatus: 'passed',
                    },
                ],
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
            releaseStreamId: release112.id,
            tickets: {
                create: [
                    {
                        ticketId: 'MAG-20550',
                        summary: 'Tối ưu hóa thời gian tải giỏ hàng',
                        changeType: 'Enhance',
                        qcStatus: 'ready for QC',
                        pendingIssues: 'Cần tối ưu thêm các câu lệnh SQL query',
                    },
                ],
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
            releaseStreamId: release113.id,
            tickets: {
                create: [
                    {
                        ticketId: 'MAG-20600',
                        summary: 'Tích hợp đăng nhập một lần SSO',
                        changeType: 'Feature',
                        qcStatus: 'waiting for QC test',
                    },
                ],
            },
        },
    });
    console.log('Seed Deployment Items, Tickets, and Builds completed.');
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
//# sourceMappingURL=seed.js.map