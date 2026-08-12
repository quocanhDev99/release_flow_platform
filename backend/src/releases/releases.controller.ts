import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ReleasesService } from './releases.service';

@Controller('releases')
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  findAll() {
    return this.releasesService.findAll();
  }

  @Get('tickets-map')
  getTicketsMap() {
    return this.releasesService.getTicketsMap();
  }

  @Post()
  create(@Body('version') version: string) {
    return this.releasesService.create(version);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.releasesService.remove(id);
  }
}
