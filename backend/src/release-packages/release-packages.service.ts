import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReleasePackagesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.releasePackage.findMany({
      include: {
        deploymentItems: {
          include: {
            repositories: true,
            user: true,
            tickets: true,
          },
        },
        bookings: {
          include: {
            deploymentWindow: {
              include: {
                environment: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.releasePackage.findUnique({
      where: { id },
      include: {
        deploymentItems: {
          include: {
            repositories: true,
            user: true,
            tickets: true,
          },
        },
        bookings: {
          include: {
            deploymentWindow: {
              include: {
                environment: true,
              },
            },
          },
        },
      },
    });
  }

  async create(data: {
    version: string;
    buildArtifactHash?: string;
    status?: string;
  }) {
    const existing = await this.prisma.releasePackage.findUnique({
      where: { version: data.version },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.releasePackage.create({
      data: {
        version: data.version,
        buildArtifactHash: data.buildArtifactHash,
        status: data.status || 'draft',
      },
    });
  }

  async update(
    id: number,
    data: { version?: string; buildArtifactHash?: string; status?: string },
  ) {
    return this.prisma.releasePackage.update({
      where: { id },
      data: {
        version: data.version,
        buildArtifactHash: data.buildArtifactHash,
        status: data.status,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.releasePackage.delete({
      where: { id },
    });
  }
}
