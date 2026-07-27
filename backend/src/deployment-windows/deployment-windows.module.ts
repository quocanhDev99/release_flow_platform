import { Module } from '@nestjs/common';
import { DeploymentWindowsService } from './deployment-windows.service';
import { DeploymentWindowsController } from './deployment-windows.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [PrismaModule, NotificationsModule, SchedulerModule],
  controllers: [DeploymentWindowsController],
  providers: [DeploymentWindowsService],
  exports: [DeploymentWindowsService],
})
export class DeploymentWindowsModule {}
