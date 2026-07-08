import { Controller, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Patch(':id/qc')
  updateQC(
    @Param('id', ParseIntPipe) id: number,
    @Body('qcStatus') qcStatus: string,
  ) {
    return this.ticketsService.updateQC(id, qcStatus);
  }
}
