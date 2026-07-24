import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron('0 8 * * *', {
    name: 'daily_deployments_reminder',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  // For testing, we can temporarily uncomment the line below to run every 10 seconds:
  // @Cron('*/10 * * * * *', { name: 'test_reminder' })
  async handleDailyReminder() {
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

    this.logger.debug(`Found ${windows.length} deployments for today.`);

    let message = `🔔 <b>Today's Deployments Reminder</b>\n\n`;
    let plainMessage = `🔔 Today's Deployments Reminder\n\n`;
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
        
        <p>Here are the scheduled deployments for today:</p>
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
        this.notificationsService.sendTeamsNotification('⏰ Daily Deployments Reminder', plainMessage),
        this.notificationsService.sendEmailNotification('[Release Flow] Today\'s Deployments Reminder', emailBody)
      ]);
      this.logger.debug('Successfully broadcasted daily reminder.');
    } catch (err) {
      this.logger.error('Failed to broadcast daily reminder', err);
    }
  }

  @Cron('30 16 * * *', { 
    name: 'tomorrow_deployments_reminder',
    timeZone: 'Asia/Ho_Chi_Minh'
  })
  async handleTomorrowReminder() {
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

    this.logger.debug(`Found ${windows.length} deployments for tomorrow.`);

    let message = `⚠️ <b>Action Required: Upcoming Deployments Tomorrow</b>\n\n`;
    message += `Please ensure all your code is fully merged into the 'devel' branch or other relevant branches for tomorrow's deployment!\n\n`;

    let plainMessage = `⚠️ Action Required: Upcoming Deployments Tomorrow\n\nPlease ensure all your code is fully merged into the 'devel' branch or other relevant branches for tomorrow's deployment!\n\n`;

    let emailHtml = `<ul style="font-family: Arial; font-size: 14px; line-height: 1.6;">`;

    windows.forEach((win) => {
      const time = new Date(win.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
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
          <h2 style="color: #e67e22; margin: 0;">⚠️ Action Required</h2>
          <p style="color: #666; margin-top: 5px; font-size: 14px;">Deployments Scheduled for Tomorrow</p>
        </div>
        
        <p style="font-size: 15px; color: #333;"><strong>Reminder for all developers:</strong> Please ensure all your code is fully merged into the 'devel' branch or other relevant branches for tomorrow's deployment!</p>
        
        <p>Deployments list:</p>
        ${emailHtml}
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px dashed #eee; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #999;">This is an automated reminder from the Release Flow Platform.</p>
        </div>
      </div>
    `;

    try {
      await Promise.all([
        this.notificationsService.sendTelegramNotification(message),
        this.notificationsService.sendSlackNotification(plainMessage),
        this.notificationsService.sendTeamsNotification('⚠️ Upcoming Deployments Tomorrow', plainMessage),
        this.notificationsService.sendEmailNotification('[Action Required] Deployments Scheduled for Tomorrow', emailBody)
      ]);
      this.logger.debug('Successfully broadcasted tomorrow reminder.');
    } catch (err) {
      this.logger.error('Failed to broadcast tomorrow reminder', err);
    }
  }
}
