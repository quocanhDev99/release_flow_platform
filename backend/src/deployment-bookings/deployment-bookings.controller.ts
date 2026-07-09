import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { DeploymentBookingsService } from './deployment-bookings.service';

@Controller('deployment-bookings')
export class DeploymentBookingsController {
  constructor(
    private readonly deploymentBookingsService: DeploymentBookingsService,
  ) {}

  @Get()
  findAll() {
    return this.deploymentBookingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deploymentBookingsService.findOne(id);
  }

  @Post()
  create(
    @Body()
    data: {
      releasePackageId: number;
      deploymentWindowId: number;
      status?: string;
    },
  ) {
    return this.deploymentBookingsService.create(data);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { status: string },
  ) {
    return this.deploymentBookingsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deploymentBookingsService.remove(id);
  }
}
