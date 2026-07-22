import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ReleasesModule } from './releases/releases.module';
import { TicketsModule } from './tickets/tickets.module';
import { DeploymentItemsModule } from './deployment-items/deployment-items.module';
import { RepositoriesController } from './repositories/repositories.controller';
import { UsersController } from './users/users.controller';
import { NotificationsModule } from './notifications/notifications.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { EnvironmentsModule } from './environments/environments.module';
import { ReleasePackagesModule } from './release-packages/release-packages.module';
import { DeploymentWindowsModule } from './deployment-windows/deployment-windows.module';
import { DeploymentBookingsModule } from './deployment-bookings/deployment-bookings.module';
import { SettingsModule } from './settings/settings.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    PrismaModule,
    ReleasesModule,
    TicketsModule,
    DeploymentItemsModule,
    NotificationsModule,
    WebhooksModule,
    EnvironmentsModule,
    ReleasePackagesModule,
    DeploymentWindowsModule,
    DeploymentBookingsModule,
    SettingsModule,
    ScheduleModule.forRoot(),
    SchedulerModule,
  ],
  controllers: [AppController, RepositoriesController, UsersController],
  providers: [AppService],
})
export class AppModule {}
