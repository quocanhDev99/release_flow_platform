import { Module, Global, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SettingsModule } from '../settings/settings.module';

import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [forwardRef(() => SettingsModule), PrismaModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
