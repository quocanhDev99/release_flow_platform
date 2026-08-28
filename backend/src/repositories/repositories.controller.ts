import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('repositories')
export class RepositoriesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.repository.findMany({
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  async create(@Body() body: { name: string; gitUrl?: string }) {
    const trimmedName = (body.name || '').trim();
    if (!trimmedName) {
      throw new Error('Repository name cannot be empty');
    }

    const existing = await this.prisma.repository.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.repository.create({
      data: {
        name: trimmedName,
        gitUrl:
          body.gitUrl ||
          `https://github.com/quocanhDev99/release_flow_platform_${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.git`,
      },
    });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.$transaction(async (tx) => {
      const items = await tx.deploymentItem.findMany({
        where: { repositories: { some: { id } } },
        select: { id: true },
      });
      const itemIds = items.map((item) => item.id);

      if (itemIds.length > 0) {
        const tickets = await tx.ticket.findMany({
          where: { deploymentItems: { some: { id: { in: itemIds } } } },
          include: { deploymentItems: true },
        });
        const ticketIdsToDelete = [];
        for (const ticket of tickets) {
          const linkedInBatch = ticket.deploymentItems.filter((di) =>
            itemIds.includes(di.id),
          ).length;
          if (ticket.deploymentItems.length <= linkedInBatch) {
            ticketIdsToDelete.push(ticket.id);
          }
        }
        if (ticketIdsToDelete.length > 0) {
          await tx.ticket.deleteMany({
            where: { id: { in: ticketIdsToDelete } },
          });
        }
        await tx.build.deleteMany({
          where: { deploymentItemId: { in: itemIds } },
        });
        await tx.deploymentItem.deleteMany({
          where: { id: { in: itemIds } },
        });
      }

      return tx.repository.delete({
        where: { id },
      });
    });
  }
}
