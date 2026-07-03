import { Controller, Get, Post, Body } from '@nestjs/common';
import { ReleasesService } from './releases.service';

@Controller('releases')
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  findAll() {
    return this.releasesService.findAll();
  }

  @Post()
  create(@Body('version') version: string) {
    return this.releasesService.create(version);
  }
}
