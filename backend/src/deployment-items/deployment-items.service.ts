/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export class TicketDto {
  id?: number;
  ticketId?: string;
  summary?: string;
  changeType?: string;
  qcStatus?: string;
  pendingIssues?: string;
}

export class CreateDeploymentItemDto {
  releaseVersion?: string;
  releaseStreamId?: number; // kept for compatibility
  releasePackageId?: number;
  sourceBranch?: string;
  status?: string;
  isMergedOnDevel?: boolean;
  repositoryId?: number;
  userId?: number;
  branchBuilds?: string[];
  tickets?: TicketDto[];
}

export class UpdateDeploymentItemDto {
  releaseVersion?: string;
  releaseStreamId?: number; // kept for compatibility
  releasePackageId?: number;
  sourceBranch?: string;
  status?: string;
  isMergedOnDevel?: boolean;
  repositoryId?: number;
  userId?: number;
  branchBuilds?: string[];
  tickets?: TicketDto[];
}

export class BulkCreateItemDto {
  repoName?: string;
  username?: string;
  releaseVersion?: string;
  sourceBranch?: string;
  isMergedOnDevel?: boolean | string;
  branchBuilds?: string[];
  ticketId!: string;
  summary?: string;
  changeType?: string;
  qcStatus?: string;
  pendingIssues?: string;
  status?: string;
}

@Injectable()
export class DeploymentItemsService {
  constructor(private prisma: PrismaService) {}

  private async resolveReleasePackageId(
    releaseVersion?: string,
    releasePackageId?: number,
  ): Promise<number | null> {
    if (releaseVersion) {
      const cleanVer = releaseVersion.replace(/x$/, '');
      let release = await this.prisma.releasePackage.findFirst({
        where: {
          OR: [
            { version: { endsWith: `/${cleanVer}`, mode: 'insensitive' } },
            { version: { contains: `/${cleanVer}.`, mode: 'insensitive' } },
            { version: { contains: `/${cleanVer}x`, mode: 'insensitive' } },
            { version: { equals: cleanVer, mode: 'insensitive' } },
          ],
        },
      });
      if (!release) {
        release = await this.prisma.releasePackage.create({
          data: { version: `sow/${cleanVer}.x` },
        });
      }
      return release.id;
    }
    return releasePackageId ? Number(releasePackageId) : null;
  }

  async findAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    repoName?: string;
    releaseVersion?: string;
    qcStatus?: string;
    status?: string;
    branchBuild?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.DeploymentItemWhereInput = {};
    if (params?.repoName) {
      where.repository = { name: params.repoName };
    }
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.releaseVersion) {
      const cleanVer = params.releaseVersion.replace(/x$/, '');
      where.releasePackage = {
        OR: [
          { version: { endsWith: `/${cleanVer}`, mode: 'insensitive' } },
          { version: { contains: `/${cleanVer}.`, mode: 'insensitive' } },
          { version: { contains: `/${cleanVer}x`, mode: 'insensitive' } },
          { version: { equals: cleanVer, mode: 'insensitive' } },
        ],
      };
    }
    if (params?.search) {
      const search = params.search;
      where.OR = [
        { sourceBranch: { contains: search, mode: 'insensitive' } },
        {
          tickets: {
            some: { ticketId: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }
    if (params?.qcStatus) {
      where.tickets = {
        some: { qcStatus: params.qcStatus },
      };
    }
    if (params?.branchBuild) {
      where.builds = {
        some: {
          environment: {
            name: { equals: params.branchBuild, mode: 'insensitive' },
          },
        },
      };
    }

    // Build dynamic orderBy
    const dir: 'asc' | 'desc' = params?.sortOrder ?? 'desc';
    let orderBy: Prisma.DeploymentItemOrderByWithRelationInput;
    switch (params?.sortBy) {
      case 'updatedAt':
        orderBy = { updatedAt: dir };
        break;
      case 'releaseVersion':
        orderBy = { releasePackage: { version: dir } };
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
        releasePackage: true,
        tickets: true,
        builds: {
          include: {
            environment: true,
          },
        },
      },
      orderBy,
    });

    // Remap releasePackage to releaseStream on output for backward compatibility with frontend
    const mappedData = data.map((item) => {
      const { releasePackage, ...rest } = item;
      return {
        ...rest,
        releaseStream: releasePackage, // Frontend expects releaseStream field
      };
    });

    return {
      data: mappedData,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const item = await this.prisma.deploymentItem.findUnique({
      where: { id },
      include: {
        repository: true,
        user: true,
        releasePackage: true,
        tickets: true,
        builds: {
          include: {
            environment: true,
          },
        },
      },
    });
    if (!item) return null;

    const { releasePackage, ...rest } = item;
    return {
      ...rest,
      releaseStream: releasePackage,
    };
  }

  async create(data: CreateDeploymentItemDto) {
    const targetPackageId = data.releasePackageId || data.releaseStreamId;
    const releasePackageId = await this.resolveReleasePackageId(
      data.releaseVersion,
      targetPackageId,
    );
    const newItem = await this.prisma.deploymentItem.create({
      data: {
        sourceBranch: data.sourceBranch || 'main',
        status: data.status || 'merged',
        isMergedOnDevel: data.isMergedOnDevel || false,
        repositoryId: Number(data.repositoryId),
        userId: Number(data.userId),
        releasePackageId,
        tickets: {
          create: data.tickets
            ? data.tickets.map((t) => ({
                ticketId: t.ticketId || '',
                summary: t.summary || '',
                changeType: t.changeType || 'Feature',
                qcStatus: t.qcStatus || '—',
                pendingIssues: t.pendingIssues || '',
              }))
            : [],
        },
      },
    });

    const branchBuilds =
      data.branchBuilds && Array.isArray(data.branchBuilds)
        ? [...data.branchBuilds]
        : [];
    if (data.isMergedOnDevel && !branchBuilds.includes('devel')) {
      branchBuilds.push('devel');
    }

    if (branchBuilds.length > 0) {
      for (const envName of branchBuilds) {
        const env = await this.prisma.environment.upsert({
          where: { name: envName },
          update: {},
          create: { name: envName, description: `Môi trường ${envName}` },
        });
        await this.prisma.build.create({
          data: {
            status: 'SUCCESS',
            deploymentItemId: newItem.id,
            environmentId: env.id,
          },
        });
      }
    }

    return this.findOne(newItem.id);
  }

  async update(id: number, data: UpdateDeploymentItemDto) {
    const targetPackageId = data.releasePackageId || data.releaseStreamId;
    const releasePackageId = await this.resolveReleasePackageId(
      data.releaseVersion,
      targetPackageId,
    );
    await this.prisma.deploymentItem.update({
      where: { id },
      data: {
        sourceBranch: data.sourceBranch,
        isMergedOnDevel: data.isMergedOnDevel,
        releasePackageId,
        status: data.status,
        userId: data.userId ? Number(data.userId) : undefined,
        repositoryId: data.repositoryId ? Number(data.repositoryId) : undefined,
      },
    });

    if (data.tickets && Array.isArray(data.tickets)) {
      for (const t of data.tickets) {
        if (t.id) {
          await this.prisma.ticket.update({
            where: { id: Number(t.id) },
            data: {
              ticketId: t.ticketId,
              summary: t.summary,
              changeType: t.changeType,
              qcStatus: t.qcStatus,
              pendingIssues: t.pendingIssues,
            },
          });
        }
      }
    }

    if (data.branchBuilds && Array.isArray(data.branchBuilds)) {
      let branchBuilds = [...data.branchBuilds];
      if (data.isMergedOnDevel === true) {
        if (!branchBuilds.includes('devel')) {
          branchBuilds.push('devel');
        }
      } else if (data.isMergedOnDevel === false) {
        branchBuilds = branchBuilds.filter((b) => b !== 'devel');
      }

      await this.prisma.build.deleteMany({
        where: {
          deploymentItemId: id,
        },
      });

      for (const envName of branchBuilds) {
        const env = await this.prisma.environment.upsert({
          where: { name: envName },
          update: {},
          create: { name: envName, description: `Môi trường ${envName}` },
        });
        await this.prisma.build.create({
          data: {
            status: 'SUCCESS',
            deploymentItemId: id,
            environmentId: env.id,
          },
        });
      }
    }

    return this.findOne(id);
  }

  async patchMergeDevel(id: number, isMergedOnDevel: boolean) {
    if (isMergedOnDevel) {
      const env = await this.prisma.environment.upsert({
        where: { name: 'devel' },
        update: {},
        create: {
          name: 'devel',
          description:
            'Môi trường tích hợp mã nguồn chung (Development server)',
        },
      });
      const existingBuild = await this.prisma.build.findFirst({
        where: {
          deploymentItemId: id,
          environmentId: env.id,
        },
      });
      if (!existingBuild) {
        await this.prisma.build.create({
          data: {
            status: 'SUCCESS',
            deploymentItemId: id,
            environmentId: env.id,
          },
        });
      }
    } else {
      const env = await this.prisma.environment.findUnique({
        where: { name: 'devel' },
      });
      if (env) {
        await this.prisma.build.deleteMany({
          where: {
            deploymentItemId: id,
            environmentId: env.id,
          },
        });
      }
    }

    const updated = await this.prisma.deploymentItem.update({
      where: { id },
      data: { isMergedOnDevel },
      include: {
        repository: true,
        user: true,
        releasePackage: true,
        tickets: true,
        builds: {
          include: {
            environment: true,
          },
        },
      },
    });

    const { releasePackage, ...rest } = updated;
    return {
      ...rest,
      releaseStream: releasePackage,
    };
  }

  async bulkCreate(items: BulkCreateItemDto[]) {
    const results = [];
    const processedKeys = new Set<string>();

    for (const item of items) {
      if (!item.ticketId) continue;

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

      let releasePackageId: number | null = null;
      if (releaseVersion) {
        const release = await this.prisma.releasePackage.upsert({
          where: { version: releaseVersion },
          update: {},
          create: { version: releaseVersion },
        });
        releasePackageId = release.id;
      }

      const batchKey = `${item.ticketId.trim().toLowerCase()}_${repository.id}_${releasePackageId || 0}`;
      if (processedKeys.has(batchKey)) {
        console.log(
          `[IMPORT] Skipping duplicate ticket ${item.ticketId} in same upload batch`,
        );
        continue;
      }
      processedKeys.add(batchKey);

      const isMergedOnDevel =
        item.isMergedOnDevel === true ||
        item.isMergedOnDevel === 'true' ||
        String(item.isMergedOnDevel).toLowerCase() === 'yes';

      const branchBuilds =
        item.branchBuilds && Array.isArray(item.branchBuilds)
          ? [...item.branchBuilds]
          : [];
      if (isMergedOnDevel && !branchBuilds.includes('devel')) {
        branchBuilds.push('devel');
      }

      // Check duplicates in many-to-many relationship
      const existingInDb = await this.prisma.ticket.findFirst({
        where: {
          ticketId: item.ticketId.trim(),
          deploymentItems: {
            some: {
              repositoryId: repository.id,
              releasePackageId: releasePackageId,
            },
          },
        },
        include: {
          deploymentItems: true,
        },
      });

      let dbItem: any;

      if (existingInDb && existingInDb.deploymentItems.length > 0) {
        console.log(
          `[IMPORT] Updating existing deployment item for ticket ${item.ticketId}...`,
        );
        const firstLinkedItem = existingInDb.deploymentItems[0];
        dbItem = await this.prisma.deploymentItem.update({
          where: { id: firstLinkedItem.id },
          data: {
            sourceBranch: item.sourceBranch || firstLinkedItem.sourceBranch,
            status: item.status || firstLinkedItem.status,
            isMergedOnDevel,
          },
        });

        await this.prisma.build.deleteMany({
          where: { deploymentItemId: dbItem.id },
        });
      } else {
        dbItem = await this.prisma.deploymentItem.create({
          data: {
            sourceBranch: item.sourceBranch || 'main',
            status: item.status || 'merged',
            isMergedOnDevel,
            repositoryId: repository.id,
            userId: user.id,
            releasePackageId,
            tickets: {
              create: [
                {
                  ticketId: item.ticketId,
                  summary: item.summary || '',
                  changeType: item.changeType || 'Feature',
                  qcStatus: item.qcStatus || '—',
                  pendingIssues: item.pendingIssues || '',
                },
              ],
            },
          },
        });
      }

      if (branchBuilds.length > 0) {
        for (const envName of branchBuilds) {
          const env = await this.prisma.environment.upsert({
            where: { name: envName },
            update: {},
            create: { name: envName, description: `Môi trường ${envName}` },
          });
          await this.prisma.build.create({
            data: {
              status: 'SUCCESS',
              deploymentItemId: dbItem.id,
              environmentId: env.id,
            },
          });
        }
      }

      results.push(dbItem);
    }
    return results;
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.deploymentItem.findUnique({
        where: { id },
        include: { tickets: { include: { deploymentItems: true } } },
      });
      if (item) {
        for (const ticket of item.tickets) {
          if (ticket.deploymentItems.length <= 1) {
            await tx.ticket.delete({ where: { id: ticket.id } });
          }
        }
      }
      await tx.build.deleteMany({
        where: { deploymentItemId: id },
      });
      return tx.deploymentItem.delete({
        where: { id },
      });
    });
  }

  async bulkDelete(ids: number[]) {
    return this.prisma.$transaction(async (tx) => {
      const items = await tx.deploymentItem.findMany({
        where: { id: { in: ids } },
        include: { tickets: { include: { deploymentItems: true } } },
      });
      const ticketIdsToDelete = [];
      for (const item of items) {
        for (const ticket of item.tickets) {
          const linkedItemsInBatch = ticket.deploymentItems.filter((di) =>
            ids.includes(di.id),
          ).length;
          if (ticket.deploymentItems.length <= linkedItemsInBatch) {
            ticketIdsToDelete.push(ticket.id);
          }
        }
      }
      if (ticketIdsToDelete.length > 0) {
        await tx.ticket.deleteMany({
          where: { id: { in: ticketIdsToDelete } },
        });
      }
      await tx.build.deleteMany({
        where: { deploymentItemId: { in: ids } },
      });
      return tx.deploymentItem.deleteMany({
        where: { id: { in: ids } },
      });
    });
  }

  async bulkUpdate(data: {
    ids: number[];
    releaseStreamId?: number; // kept for compatibility
    releasePackageId?: number;
    qcStatus?: string;
    isMergedOnDevel?: boolean;
    status?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      const targetPackageId =
        data.releasePackageId !== undefined
          ? data.releasePackageId
          : data.releaseStreamId;
      if (targetPackageId !== undefined) {
        updateData.releasePackageId =
          targetPackageId === null || targetPackageId === undefined
            ? null
            : Number(targetPackageId);
      }
      if (data.isMergedOnDevel !== undefined) {
        updateData.isMergedOnDevel = data.isMergedOnDevel;
      }
      if (data.status !== undefined) {
        updateData.status = data.status;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.deploymentItem.updateMany({
          where: { id: { in: data.ids.map(Number) } },
          data: updateData,
        });
      }

      if (data.qcStatus !== undefined) {
        await tx.ticket.updateMany({
          where: {
            deploymentItems: { some: { id: { in: data.ids.map(Number) } } },
          },
          data: { qcStatus: data.qcStatus },
        });
      }
    });
  }
}
