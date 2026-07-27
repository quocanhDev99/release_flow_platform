import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CronService implements OnModuleInit {
  private readonly logger = new Logger(CronService.name);
  private lastSentDateStr = '';

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    this.logger.log('CronService initialized. Checking today\'s deployment schedule for automatic morning notifications...');
    // Automatically check and send morning notification if there are deployments today
    await this.handleDailyReminder(false);
  }

  @Cron('0 8 * * *', {
    name: 'daily_deployments_reminder',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async triggerDailyCron() {
    await this.handleDailyReminder(true);
  }

  async handleDailyReminder(force = false, currentUsername?: string) {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (!force && this.lastSentDateStr === todayStr) {
      this.logger.debug(`Daily deployment reminder for ${todayStr} has already been sent automatically.`);
      return;
    }

    this.logger.debug('Running daily deployment reminder check...');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const windows = await this.prisma.deploymentWindow.findMany({
      where: {
        startTime: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          notIn: ['cancelled', 'completed'],
        },
      },
      include: {
        environment: true,
        bookings: {
          include: {
            releasePackage: true,
          },
        },
      },
    });

    if (windows.length === 0) {
      this.logger.debug('No deployments scheduled for today. Doing nothing.');
      return;
    }

    // Resolve user username to mention
    let mentionUser = currentUsername;
    if (!mentionUser) {
      const defaultUser = await this.prisma.user.findFirst();
      mentionUser = defaultUser?.username || 'ReleaseManager';
    }

    this.logger.debug(`Found ${windows.length} deployments for today. Sending automated notifications (Mentioning @${mentionUser})...`);

    let message = `🔔 <b>Today's Deployments Reminder</b>\n`;
    message += `👤 <b>Responsible/Mention:</b> @${mentionUser}\n\n`;

    let plainMessage = `🔔 Today's Deployments Reminder\n`;
    plainMessage += `👤 Responsible/Mention: @${mentionUser}\n\n`;

    let emailHtml = `<ul style="font-family: Arial; font-size: 14px; line-height: 1.6;">`;

    windows.forEach((win) => {
      const time = new Date(win.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const env = win.environment.name;
      const version = win.bookings?.[0]?.releasePackage?.version || 'N/A';

      message += `• <b>${env}</b> at ${time} (Version: <code>${version}</code>)\n`;
      plainMessage += `• ${env} at ${time} (Version: ${version})\n`;
      emailHtml += `<li><strong>${env}</strong> at ${time} (Version: <code>${version}</code>)</li>`;
    });

    emailHtml += `</ul>`;

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; margin: 0;">⏰ Daily Reminder</h2>
          <p style="color: #666; margin-top: 5px; font-size: 14px;">Release Flow Platform Scheduler</p>
        </div>
        
        <p>Attention @${mentionUser}, here are the scheduled deployments for today:</p>
        ${emailHtml}
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px dashed #eee; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #999;">This is an automated daily reminder.</p>
        </div>
      </div>
    `;

    try {
      await Promise.all([
        this.notificationsService.sendTelegramNotification(message),
        this.notificationsService.sendSlackNotification(plainMessage),
        this.notificationsService.sendTeamsNotification('⏰ Daily Deployments Reminder', plainMessage, mentionUser),
        this.notificationsService.sendEmailNotification('[Release Flow] Today\'s Deployments Reminder', emailBody)
      ]);
      this.lastSentDateStr = todayStr;
      this.logger.log(`Successfully sent automated daily deployment notification for ${todayStr} (Mentioned @${mentionUser}).`);
    } catch (err) {
      this.logger.error('Failed to broadcast daily reminder', err);
    }
  }

  @Cron('30 16 * * *', { 
    name: 'tomorrow_deployments_reminder',
    timeZone: 'Asia/Ho_Chi_Minh'
  })
  async handleTomorrowReminder(currentUsername?: string) {
    this.logger.debug('Running tomorrow deployment reminder check...');

    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date();
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const windows = await this.prisma.deploymentWindow.findMany({
      where: {
        startTime: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
        status: {
          notIn: ['cancelled', 'completed'],
        },
      },
      include: {
        environment: true,
        bookings: {
          include: {
            releasePackage: true,
          },
        },
      },
    });

    if (windows.length === 0) {
      this.logger.debug('No deployments scheduled for tomorrow. Doing nothing.');
      return;
    }

    let mentionUser = currentUsername;
    if (!mentionUser) {
      const defaultUser = await this.prisma.user.findFirst();
      mentionUser = defaultUser?.username || 'ReleaseManager';
    }

    this.logger.debug(`Found ${windows.length} deployments for tomorrow. Mentioning @${mentionUser}...`);

    let message = `⚠️ <b>Action Required: Upcoming Deployments Tomorrow</b>\n`;
    message += `👤 <b>Attention:</b> @${mentionUser}\n\n`;
    message += `Please ensure all your code is fully merged into the 'devel' branch or other relevant branches for tomorrow's deployment!\n\n`;

    let plainMessage = `⚠️ Action Required: Upcoming Deployments Tomorrow\n👤 Attention: @${mentionUser}\n\nPlease ensure all your code is fully merged into the 'devel' branch or other relevant branches for tomorrow's deployment!\n\n`;

    let emailHtml = `<ul style="font-family: Arial; font-size: 14px; line-height: 1.6;">`;

    windows.forEach((win) => {
      const time = new Date(win.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const env = win.environment.name;
      const version = win.bookings?.[0]?.releasePackage?.version || 'N/A';

      message += `• <b>${env}</b> at ${time} (Version: <code>${version}</code>)\n`;
      plainMessage += `• ${env} at ${time} (Version: ${version})\n`;
      emailHtml += `<li><strong>${env}</strong> at ${time} (Version: <code>${version}</code>)</li>`;
    });

    emailHtml += `</ul>`;

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #d9534f; margin: 0;">⚠️ Tomorrow's Deployments Warning</h2>
          <p style="color: #666; margin-top: 5px; font-size: 14px;">Release Flow Platform Scheduler</p>
        </div>
        
        <p>Attention @${mentionUser}, please make sure your changes are merged into target branches before deployment time tomorrow:</p>
        ${emailHtml}
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px dashed #eee; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #999;">Automated notification from Release Flow Platform.</p>
        </div>
      </div>
    `;

    try {
      await Promise.all([
        this.notificationsService.sendTelegramNotification(message),
        this.notificationsService.sendSlackNotification(plainMessage),
        this.notificationsService.sendTeamsNotification('⚠️ Tomorrow\'s Deployments Warning', plainMessage, mentionUser),
        this.notificationsService.sendEmailNotification('[Release Flow] Tomorrow\'s Deployments Warning', emailBody)
      ]);
      this.logger.log('Successfully broadcasted tomorrow deployment reminder.');
    } catch (err) {
      this.logger.error('Failed to broadcast tomorrow deployment reminder', err);
    }
  }
}
