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
import { ReleasePackagesService } from './release-packages.service';

@Controller('release-packages')
export class ReleasePackagesController {
  constructor(
    private readonly releasePackagesService: ReleasePackagesService,
  ) {}

  @Get()
  findAll() {
    return this.releasePackagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.releasePackagesService.findOne(id);
  }

  @Post()
  create(
    @Body()
    data: {
      version: string;
      buildArtifactHash?: string;
      status?: string;
    },
  ) {
    return this.releasePackagesService.create(data);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: { version?: string; buildArtifactHash?: string; status?: string },
  ) {
    return this.releasePackagesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.releasePackagesService.remove(id);
  }
}
