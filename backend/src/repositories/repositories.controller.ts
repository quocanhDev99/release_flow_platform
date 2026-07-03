import { Controller, Get } from '@nestjs/common';
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
}
