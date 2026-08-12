import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CronService } from '../scheduler/cron.service';

@Injectable()
export class DeploymentWindowsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private cronService: CronService,
  ) {}

  async notifySchedule(data: any) {
    return this.notificationsService.sendScheduleAlert(data);
  }

  async triggerReminder(developer?: string, targetDate?: string) {
    return this.cronService.handleDailyReminder(true, developer, targetDate);
  }

  async getCronStatus() {
    return {
      jobs: [
        {
          id: 'daily_reminder',
          name: 'Daily Morning Deployment Alert',
          cron: '0 8 * * *',
          scheduleTime: '08:00 AM (Asia/Ho_Chi_Minh)',
          status: 'active',
          channels: ['Telegram', 'MS Teams', 'Slack', 'Email'],
          description: 'Automatically scans today\'s deployment schedule and notifies team with @mention.'
        },
        {
          id: 'tomorrow_reminder',
          name: 'Tomorrow Deployment Warning Alert',
          cron: '30 16 * * *',
          scheduleTime: '16:30 PM (Asia/Ho_Chi_Minh)',
          status: 'active',
          channels: ['Telegram', 'MS Teams', 'Slack', 'Email'],
          description: 'Notifies team about upcoming tomorrow deployments to merge code on time.'
        }
      ]
    };
  }

  async runCronJob(jobId: string, developer?: string) {
    if (jobId === 'tomorrow_reminder') {
      await this.cronService.handleTomorrowReminder(developer);
      return { success: true, message: 'Tomorrow deployment warning alert triggered successfully!' };
    } else {
      await this.cronService.handleDailyReminder(true, developer);
      return { success: true, message: 'Daily morning deployment alert triggered successfully!' };
    }
  }

  // 1. Windows CRUD
  async findAllWindows() {
    return this.prisma.deploymentWindow.findMany({
      include: {
        environment: true,
        policy: true,
        bookings: {
          include: {
            releasePackage: {
              include: {
                deploymentItems: {
                  include: {
                    tickets: true,
                  },
                },
              },
            },
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
            releasePackage: {
              include: {
                deploymentItems: {
                  include: {
                    tickets: true,
                  },
                },
              },
            },
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
