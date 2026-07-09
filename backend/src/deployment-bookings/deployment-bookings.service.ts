import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeploymentBookingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.deploymentBooking.findMany({
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
        deploymentWindow: {
          include: {
            environment: true,
          },
        },
      },
      orderBy: { bookedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.deploymentBooking.findUnique({
      where: { id },
      include: {
        releasePackage: true,
        deploymentWindow: {
          include: {
            environment: true,
          },
        },
      },
    });
  }

  async create(data: {
    releasePackageId: number;
    deploymentWindowId: number;
    status?: string;
  }) {
    const releasePackageId = Number(data.releasePackageId);
    const deploymentWindowId = Number(data.deploymentWindowId);

    // 1. Get window to check capacity
    const window = await this.prisma.deploymentWindow.findUnique({
      where: { id: deploymentWindowId },
      include: {
        bookings: {
          where: { status: 'approved' },
        },
      },
    });

    if (!window) {
      throw new BadRequestException(
        'Khung giờ triển khai (Deployment Window) không tồn tại.',
      );
    }

    // Check if package already booked in this window
    const existing = await this.prisma.deploymentBooking.findFirst({
      where: {
        releasePackageId,
        deploymentWindowId,
      },
    });
    if (existing) {
      return existing;
    }

    // Basic capacity check: count how many bookings are already approved
    const currentApprovedCount = window.bookings.length;
    const initialStatus = data.status || 'pending';

    // If capacity exceeded, we can set status to 'pending' or raise warning
    if (currentApprovedCount >= window.capacity) {
      // Auto queue it as pending and warn or throw error if they request auto-approve
      if (initialStatus === 'approved') {
        throw new BadRequestException(
          `Khung giờ triển khai đã đạt giới hạn dung lượng (${window.capacity} gói). Không thể tự động phê duyệt.`,
        );
      }
    }

    return this.prisma.deploymentBooking.create({
      data: {
        releasePackageId,
        deploymentWindowId,
        status: initialStatus,
      },
    });
  }

  async update(id: number, data: { status: string }) {
    const booking = await this.prisma.deploymentBooking.findUnique({
      where: { id },
    });
    if (!booking) {
      throw new BadRequestException('Bản ghi Booking không tồn tại.');
    }

    if (data.status === 'approved') {
      // Check capacity of window
      const window = await this.prisma.deploymentWindow.findUnique({
        where: { id: booking.deploymentWindowId },
        include: {
          bookings: {
            where: { status: 'approved', id: { not: id } },
          },
        },
      });

      if (window && window.bookings.length >= window.capacity) {
        throw new BadRequestException(
          `Không thể phê duyệt. Khung giờ triển khai đã đầy dung lượng (${window.capacity} gói).`,
        );
      }
    }

    return this.prisma.deploymentBooking.update({
      where: { id },
      data: {
        status: data.status,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.deploymentBooking.delete({
      where: { id },
    });
  }
}
