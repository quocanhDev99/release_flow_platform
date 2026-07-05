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

@Module({
  imports: [
    PrismaModule,
    ReleasesModule,
    TicketsModule,
    DeploymentItemsModule,
    NotificationsModule,
    WebhooksModule,
  ],
  controllers: [AppController, RepositoriesController, UsersController],
  providers: [AppService],
})
export class AppModule {}
