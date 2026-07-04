import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
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
  create(@Body() body: { name: string; gitUrl?: string }) {
    return this.prisma.repository.create({
      data: {
        name: body.name,
        gitUrl: body.gitUrl || `https://github.com/quocanhDev99/release_flow_platform_${body.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.git`,
      },
    });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.$transaction(async (tx) => {
      const items = await tx.deploymentItem.findMany({
        where: { repositoryId: id },
        select: { id: true },
      });
      const itemIds = items.map(item => item.id);

      if (itemIds.length > 0) {
        await tx.ticket.deleteMany({
          where: { deploymentItemId: { in: itemIds } },
        });
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
