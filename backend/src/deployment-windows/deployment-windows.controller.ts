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
import { ReleaseNotesService } from '../scheduler/release-notes.service';

@Controller('deployment-windows')
export class DeploymentWindowsController {
  constructor(
    private readonly deploymentWindowsService: DeploymentWindowsService,
    private readonly releaseNotesService: ReleaseNotesService,
  ) {}

  // Release Notes Endpoints
  @Get(':id/release-notes')
  getReleaseNotes(@Param('id', ParseIntPipe) id: number) {
    return this.releaseNotesService.generateReleaseNotes(id);
  }

  @Post(':id/release-notes/broadcast')
  broadcastReleaseNotes(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { channels?: string[]; customNote?: string },
  ) {
    return this.releaseNotesService.broadcastReleaseNotes(id, body);
  }

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

  @Post('notify')
  notifySchedule(@Body() data: any) {
    return this.deploymentWindowsService.notifySchedule(data);
  }

  @Post('trigger-reminder')
  triggerReminder(@Body() body?: { developer?: string; targetDate?: string }) {
    return this.deploymentWindowsService.triggerReminder(body?.developer, body?.targetDate);
  }

  @Get('cron/status')
  getCronStatus() {
    return this.deploymentWindowsService.getCronStatus();
  }

  @Post('cron/run/:jobId')
  runCronJob(@Param('jobId') jobId: string, @Body() body?: { developer?: string }) {
    return this.deploymentWindowsService.runCronJob(jobId, body?.developer);
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
