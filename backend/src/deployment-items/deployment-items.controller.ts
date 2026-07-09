import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  DeploymentItemsService,
  CreateDeploymentItemDto,
  UpdateDeploymentItemDto,
  BulkCreateItemDto,
} from './deployment-items.service';

@Controller('deployment-items')
export class DeploymentItemsController {
  constructor(
    private readonly deploymentItemsService: DeploymentItemsService,
  ) {}

  @Get('admin/repair-db')
  repairDb() {
    return this.deploymentItemsService.repairDb();
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('repoName') repoName?: string,
    @Query('releaseVersion') releaseVersion?: string,
    @Query('qcStatus') qcStatus?: string,
    @Query('status') status?: string,
    @Query('branchBuild') branchBuild?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.deploymentItemsService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search,
      repoName,
      releaseVersion,
      qcStatus,
      status,
      branchBuild,
      sortBy,
      sortOrder:
        sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : undefined,
    });
  }

  @Post('bulk')
  bulkCreate(@Body() items: BulkCreateItemDto[]) {
    return this.deploymentItemsService.bulkCreate(items);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deploymentItemsService.findOne(id);
  }

  @Post()
  create(@Body() data: CreateDeploymentItemDto) {
    return this.deploymentItemsService.create(data);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateDeploymentItemDto,
  ) {
    return this.deploymentItemsService.update(id, data);
  }

  @Patch(':id/merge-devel')
  patchMergeDevel(
    @Param('id', ParseIntPipe) id: number,
    @Body('isMergedOnDevel') isMergedOnDevel: boolean,
  ) {
    return this.deploymentItemsService.patchMergeDevel(id, isMergedOnDevel);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deploymentItemsService.remove(id);
  }

  @Post('bulk-delete')
  bulkDelete(@Body('ids') ids: number[]) {
    return this.deploymentItemsService.bulkDelete(ids);
  }

  @Post('bulk-update')
  bulkUpdate(@Body() data: any) {
    return this.deploymentItemsService.bulkUpdate(data);
  }
}
