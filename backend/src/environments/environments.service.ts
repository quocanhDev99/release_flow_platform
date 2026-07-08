import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnvironmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.environment.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(name: string, description?: string) {
    return this.prisma.environment.upsert({
      where: { name },
      update: {},
      create: { name, description },
    });
  }

  async remove(id: number) {
    // Delete any builds associated with this environment first to avoid foreign key constraints
    await this.prisma.build.deleteMany({
      where: { environmentId: id },
    });

    return this.prisma.environment.delete({
      where: { id },
    });
  }
}
