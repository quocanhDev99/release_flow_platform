import { Module } from '@nestjs/common';
import { DeploymentBookingsService } from './deployment-bookings.service';
import { DeploymentBookingsController } from './deployment-bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeploymentBookingsController],
  providers: [DeploymentBookingsService],
  exports: [DeploymentBookingsService],
})
export class DeploymentBookingsModule {}
