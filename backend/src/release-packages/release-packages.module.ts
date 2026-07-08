import { Module } from '@nestjs/common';
import { ReleasePackagesService } from './release-packages.service';
import { ReleasePackagesController } from './release-packages.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReleasePackagesController],
  providers: [ReleasePackagesService],
  exports: [ReleasePackagesService],
})
export class ReleasePackagesModule {}
