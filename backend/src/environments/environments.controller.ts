import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';

@Controller('environments')
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Get()
  findAll() {
    return this.environmentsService.findAll();
  }

  @Post()
  create(@Body() body: { name: string; description?: string }) {
    return this.environmentsService.create(body.name, body.description);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.environmentsService.remove(Number(id));
  }
}
