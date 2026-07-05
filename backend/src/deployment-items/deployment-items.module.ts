import { Module } from '@nestjs/common';
import { DeploymentItemsService } from './deployment-items.service';
import { DeploymentItemsController } from './deployment-items.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeploymentItemsController],
  providers: [DeploymentItemsService],
  exports: [DeploymentItemsService],
})
export class DeploymentItemsModule {}
