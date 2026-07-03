import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async updateQC(id: number, qcStatus: string) {
    return this.prisma.ticket.update({
      where: { id },
      data: { qcStatus },
    });
  }
}
