import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { ReleaseNotesService } from './release-notes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [CronService, ReleaseNotesService],
  exports: [CronService, ReleaseNotesService],
})
export class SchedulerModule {}
