import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ReleasesModule } from './releases/releases.module';
import { TicketsModule } from './tickets/tickets.module';
import { DeploymentItemsModule } from './deployment-items/deployment-items.module';
import { RepositoriesController } from './repositories/repositories.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [PrismaModule, ReleasesModule, TicketsModule, DeploymentItemsModule],
  controllers: [AppController, RepositoriesController, UsersController],
  providers: [AppService],
})
export class AppModule {}
