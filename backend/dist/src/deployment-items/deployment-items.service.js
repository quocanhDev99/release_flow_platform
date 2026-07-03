"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentItemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DeploymentItemsService = class DeploymentItemsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolveReleaseStreamId(releaseVersion, releaseStreamId) {
        if (releaseVersion) {
            const cleanVer = releaseVersion.replace(/x$/, '');
            let release = await this.prisma.releaseStream.findFirst({
                where: {
                    OR: [
                        { version: { endsWith: `/${cleanVer}`, mode: 'insensitive' } },
                        { version: { contains: `/${cleanVer}.`, mode: 'insensitive' } },
                        { version: { contains: `/${cleanVer}x`, mode: 'insensitive' } },
                        { version: { equals: cleanVer, mode: 'insensitive' } }
                    ]
                }
            });
            if (!release) {
                release = await this.prisma.releaseStream.create({
                    data: { version: `sow/${cleanVer}.x` }
                });
            }
            return release.id;
        }
        return releaseStreamId ? Number(releaseStreamId) : null;
    }
    async findAll(params) {
        const page = params?.page || 1;
        const pageSize = params?.pageSize || 10;
        const skip = (page - 1) * pageSize;
        const take = pageSize;
        const where = {};
        if (params?.repoName) {
            where.repository = { name: params.repoName };
        }
        if (params?.status) {
            where.status = params.status;
        }
        if (params?.releaseVersion) {
            const cleanVer = params.releaseVersion.replace(/x$/, '');
            where.releaseStream = {
                OR: [
                    { version: { endsWith: `/${cleanVer}`, mode: 'insensitive' } },
                    { version: { contains: `/${cleanVer}.`, mode: 'insensitive' } },
                    { version: { contains: `/${cleanVer}x`, mode: 'insensitive' } },
                    { version: { equals: cleanVer, mode: 'insensitive' } }
                ]
            };
        }
        if (params?.search) {
            const search = params.search;
            where.OR = [
                { sourceBranch: { contains: search, mode: 'insensitive' } },
                { tickets: { some: { ticketId: { contains: search, mode: 'insensitive' } } } },
            ];
        }
        if (params?.qcStatus) {
            where.tickets = {
                some: { qcStatus: params.qcStatus },
            };
        }
        const dir = params?.sortOrder ?? 'desc';
        let orderBy;
        switch (params?.sortBy) {
            case 'updatedAt':
                orderBy = { updatedAt: dir };
                break;
            case 'releaseVersion':
                orderBy = { releaseStream: { version: dir } };
                break;
            case 'createdAt':
            default:
                orderBy = { createdAt: dir };
                break;
        }
        const total = await this.prisma.deploymentItem.count({ where });
        const data = await this.prisma.deploymentItem.findMany({
            where,
            skip,
            take,
            include: {
                repository: true,
                user: true,
                releaseStream: true,
                tickets: true,
                builds: {
                    include: {
                        environment: true,
                    },
                },
            },
            orderBy,
        });
        return {
            data,
            total,
            page,
            pageSize,
        };
    }
    async findOne(id) {
        return this.prisma.deploymentItem.findUnique({
            where: { id },
            include: {
                repository: true,
                user: true,
                releaseStream: true,
                tickets: true,
                builds: {
                    include: {
                        environment: true,
                    },
                },
            },
        });
    }
    async create(data) {
        const releaseStreamId = await this.resolveReleaseStreamId(data.releaseVersion, data.releaseStreamId);
        return this.prisma.deploymentItem.create({
            data: {
                sourceBranch: data.sourceBranch,
                status: data.status || 'merged',
                isMergedOnDevel: data.isMergedOnDevel || false,
                repositoryId: Number(data.repositoryId),
                userId: Number(data.userId),
                releaseStreamId,
                tickets: {
                    create: data.tickets || [],
                },
            },
            include: {
                repository: true,
                user: true,
                releaseStream: true,
                tickets: true,
                builds: {
                    include: {
                        environment: true,
                    },
                },
            },
        });
    }
    async update(id, data) {
        const releaseStreamId = await this.resolveReleaseStreamId(data.releaseVersion, data.releaseStreamId);
        await this.prisma.deploymentItem.update({
            where: { id },
            data: {
                sourceBranch: data.sourceBranch,
                isMergedOnDevel: data.isMergedOnDevel,
                releaseStreamId,
                status: data.status,
                userId: data.userId ? Number(data.userId) : undefined,
            },
        });
        if (data.tickets && Array.isArray(data.tickets)) {
            for (const t of data.tickets) {
                if (t.id) {
                    await this.prisma.ticket.update({
                        where: { id: Number(t.id) },
                        data: {
                            changeType: t.changeType,
                            qcStatus: t.qcStatus,
                            pendingIssues: t.pendingIssues,
                        },
                    });
                }
            }
        }
        return this.findOne(id);
    }
    async patchMergeDevel(id, isMergedOnDevel) {
        return this.prisma.deploymentItem.update({
            where: { id },
            data: { isMergedOnDevel },
            include: {
                repository: true,
                user: true,
                releaseStream: true,
                tickets: true,
                builds: {
                    include: {
                        environment: true,
                    },
                },
            },
        });
    }
    async bulkCreate(items) {
        const results = [];
        for (const item of items) {
            if (!item.ticketId)
                continue;
            const repoName = item.repoName || 'Core';
            const repository = await this.prisma.repository.upsert({
                where: { name: repoName },
                update: {},
                create: { name: repoName },
            });
            const username = item.username || 'system';
            const user = await this.prisma.user.upsert({
                where: { username },
                update: {},
                create: { username, email: `${username}@example.com` },
            });
            let releaseVersion = item.releaseVersion;
            if (!releaseVersion && item.sourceBranch) {
                const match = item.sourceBranch.match(/(\d+)\.(\d+)/);
                if (match) {
                    const prefixMatch = item.sourceBranch.match(/^(sow|som)\//i);
                    const prefix = prefixMatch ? prefixMatch[1].toLowerCase() : 'sow';
                    releaseVersion = `${prefix}/${match[1]}.${match[2]}.x`;
                }
            }
            let releaseStreamId = null;
            if (releaseVersion) {
                const release = await this.prisma.releaseStream.upsert({
                    where: { version: releaseVersion },
                    update: {},
                    create: { version: releaseVersion },
                });
                releaseStreamId = release.id;
            }
            const isMergedOnDevel = item.isMergedOnDevel === true ||
                item.isMergedOnDevel === 'true' ||
                String(item.isMergedOnDevel).toLowerCase() === 'yes';
            const dbItem = await this.prisma.deploymentItem.create({
                data: {
                    sourceBranch: item.sourceBranch || 'main',
                    status: item.status || 'merged',
                    isMergedOnDevel,
                    repositoryId: repository.id,
                    userId: user.id,
                    releaseStreamId,
                    tickets: {
                        create: [
                            {
                                ticketId: item.ticketId,
                                summary: item.summary || '',
                                changeType: item.changeType || 'Feature',
                                qcStatus: item.qcStatus || 'waiting for QC test',
                                pendingIssues: item.pendingIssues || '',
                            },
                        ],
                    },
                },
            });
            results.push(dbItem);
        }
        return results;
    }
    async remove(id) {
        return this.prisma.deploymentItem.delete({
            where: { id },
        });
    }
};
exports.DeploymentItemsService = DeploymentItemsService;
exports.DeploymentItemsService = DeploymentItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DeploymentItemsService);
//# sourceMappingURL=deployment-items.service.js.map