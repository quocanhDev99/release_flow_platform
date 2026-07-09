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
import { DeploymentWindowsService } from './deployment-windows.service';

@Controller('deployment-windows')
export class DeploymentWindowsController {
  constructor(
    private readonly deploymentWindowsService: DeploymentWindowsService,
  ) {}

  // Windows Endpoints
  @Get()
  findAllWindows() {
    return this.deploymentWindowsService.findAllWindows();
  }

  @Get(':id')
  findOneWindow(@Param('id', ParseIntPipe) id: number) {
    return this.deploymentWindowsService.findOneWindow(id);
  }

  @Post()
  createWindow(
    @Body()
    data: {
      startTime: string;
      endTime: string;
      freezeTime: string;
      capacity?: number;
      status?: string;
      policyId?: number;
      environmentId: number;
    },
  ) {
    return this.deploymentWindowsService.createWindow(data);
  }

  @Put(':id')
  updateWindow(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: {
      startTime?: string;
      endTime?: string;
      freezeTime?: string;
      capacity?: number;
      status?: string;
      policyId?: number;
      environmentId?: number;
    },
  ) {
    return this.deploymentWindowsService.updateWindow(id, data);
  }

  @Delete(':id')
  removeWindow(@Param('id', ParseIntPipe) id: number) {
    return this.deploymentWindowsService.removeWindow(id);
  }

  // Policies Endpoints
  @Get('policies/all')
  findAllPolicies() {
    return this.deploymentWindowsService.findAllPolicies();
  }

  @Post('policies')
  createPolicy(
    @Body()
    data: {
      name: string;
      cronSchedule: string;
      targetEnvironment: string;
      capacityLimit?: number;
      freezeWindow?: number;
    },
  ) {
    return this.deploymentWindowsService.createPolicy(data);
  }

  @Delete('policies/:id')
  removePolicy(@Param('id', ParseIntPipe) id: number) {
    return this.deploymentWindowsService.removePolicy(id);
  }
}
