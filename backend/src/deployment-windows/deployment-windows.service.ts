import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeploymentWindowsService {
  constructor(private prisma: PrismaService) {}

  // 1. Windows CRUD
  async findAllWindows() {
    return this.prisma.deploymentWindow.findMany({
      include: {
        environment: true,
        policy: true,
        bookings: {
          include: {
            releasePackage: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOneWindow(id: number) {
    return this.prisma.deploymentWindow.findUnique({
      where: { id },
      include: {
        environment: true,
        policy: true,
        bookings: {
          include: {
            releasePackage: true,
          },
        },
      },
    });
  }

  async createWindow(data: {
    startTime: Date | string;
    endTime: Date | string;
    freezeTime: Date | string;
    capacity?: number;
    status?: string;
    policyId?: number;
    environmentId: number;
  }) {
    return this.prisma.deploymentWindow.create({
      data: {
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        freezeTime: new Date(data.freezeTime),
        capacity: data.capacity ?? 20,
        status: data.status || 'open',
        policyId: data.policyId ? Number(data.policyId) : null,
        environmentId: Number(data.environmentId),
      },
    });
  }

  async updateWindow(
    id: number,
    data: {
      startTime?: Date | string;
      endTime?: Date | string;
      freezeTime?: Date | string;
      capacity?: number;
      status?: string;
      policyId?: number;
      environmentId?: number;
    },
  ) {
    return this.prisma.deploymentWindow.update({
      where: { id },
      data: {
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        freezeTime: data.freezeTime ? new Date(data.freezeTime) : undefined,
        capacity:
          data.capacity !== undefined ? Number(data.capacity) : undefined,
        status: data.status,
        policyId:
          data.policyId !== undefined
            ? data.policyId
              ? Number(data.policyId)
              : null
            : undefined,
        environmentId: data.environmentId
          ? Number(data.environmentId)
          : undefined,
      },
    });
  }

  async removeWindow(id: number) {
    return this.prisma.deploymentWindow.delete({
      where: { id },
    });
  }

  // 2. Policies CRUD
  async findAllPolicies() {
    return this.prisma.deploymentPolicy.findMany({
      include: {
        windows: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createPolicy(data: {
    name: string;
    cronSchedule: string;
    targetEnvironment: string;
    capacityLimit?: number;
    freezeWindow?: number;
  }) {
    return this.prisma.deploymentPolicy.create({
      data: {
        name: data.name,
        cronSchedule: data.cronSchedule,
        targetEnvironment: data.targetEnvironment,
        capacityLimit: data.capacityLimit ?? 20,
        freezeWindow: data.freezeWindow ?? 24,
      },
    });
  }

  async removePolicy(id: number) {
    return this.prisma.deploymentPolicy.delete({
      where: { id },
    });
  }
}
