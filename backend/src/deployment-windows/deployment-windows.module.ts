import { Module } from '@nestjs/common';
import { DeploymentWindowsService } from './deployment-windows.service';
import { DeploymentWindowsController } from './deployment-windows.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeploymentWindowsController],
  providers: [DeploymentWindowsService],
  exports: [DeploymentWindowsService],
})
export class DeploymentWindowsModule {}
