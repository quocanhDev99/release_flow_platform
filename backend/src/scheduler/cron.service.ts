import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface RelatedTicket {
  ticketId: string;
  summary?: string;
  url: string;
}

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
    // Automatically check and send morning notification if there are deployments today (non-blocking)
    setTimeout(() => {
      this.handleDailyReminder(false).catch(err => {
        this.logger.warn(`Automatic morning reminder check skipped: ${err.message}`);
      });
    }, 5000);
  }

  /**
   * Daily morning cron job: 08:30 AM (Asia/Ho_Chi_Minh)
   */
  @Cron('30 8 * * 1-5', {
    name: 'daily_deployments_reminder',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async triggerDailyMorningCron() {
    this.logger.log('Executing automated 08:30 AM Daily Deployment Reminder Cron...');
    await this.handleDailyReminder(false);
  }

  /**
   * Afternoon warning cron job for tomorrow's releases: 16:30 PM (Asia/Ho_Chi_Minh)
   */
  @Cron('30 16 * * 1-5', { 
    name: 'tomorrow_deployments_reminder',
    timeZone: 'Asia/Ho_Chi_Minh'
  })
  async triggerTomorrowWarningCron() {
    this.logger.log('Executing automated 16:30 PM Tomorrow Deployment Reminder Cron...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await this.handleDailyReminder(false, undefined, tomorrow);
  }

  /**
   * Retrieves all tickets associated with a given Fix Version / Release Package or environment.
   */
  async getTicketsForFixVersion(releasePackageId?: number, versionString?: string): Promise<RelatedTicket[]> {
    const ticketMap = new Map<string, RelatedTicket>();
    const baseUrl = 'https://storai.atlassian.net/browse/';

    // 1. Check direct relation items from releasePackageId
    if (releasePackageId) {
      const items = await this.prisma.deploymentItem.findMany({
        where: { releasePackageId },
        include: { tickets: true }
      });
      for (const item of items) {
        for (const t of item.tickets) {
          if (t.ticketId) {
            const ids = t.ticketId.split(',').map(s => s.trim()).filter(Boolean);
            for (const singleId of ids) {
              if (!ticketMap.has(singleId)) {
                ticketMap.set(singleId, {
                  ticketId: singleId,
                  summary: t.summary || undefined,
                  url: `${baseUrl}${singleId}`
                });
              }
            }
          }
        }
      }
    }

    // 2. Numerical version matching (e.g. "Release PROD - 1.13.1" or "v1.12.0" -> "1.13.1")
    const match = versionString ? versionString.match(/\d+(\.\d+)+/) : null;
    const cleanVer = match ? match[0] : (versionString && versionString !== 'N/A' ? versionString.trim() : null);

    if (cleanVer) {
      const items = await this.prisma.deploymentItem.findMany({
        where: {
          releasePackage: {
            version: { contains: cleanVer, mode: 'insensitive' }
          }
        },
        include: { tickets: true }
      });
      for (const item of items) {
        for (const t of item.tickets) {
          if (t.ticketId) {
            const ids = t.ticketId.split(',').map(s => s.trim()).filter(Boolean);
            for (const singleId of ids) {
              if (!ticketMap.has(singleId)) {
                ticketMap.set(singleId, {
                  ticketId: singleId,
                  summary: t.summary || undefined,
                  url: `${baseUrl}${singleId}`
                });
              }
            }
          }
        }
      }
    }

    // 3. Fallback for STG / DEV builds without specific version numbers
    if (ticketMap.size === 0 && versionString && /STG|DEV|staging/i.test(versionString)) {
      const recentItems = await this.prisma.deploymentItem.findMany({
        where: {
          status: { in: ['merged', 'pending'] }
        },
        orderBy: { updatedAt: 'desc' },
        take: 12,
        include: { tickets: true }
      });
      for (const item of recentItems) {
        for (const t of item.tickets) {
          if (t.ticketId) {
            const ids = t.ticketId.split(',').map(s => s.trim()).filter(Boolean);
            for (const singleId of ids) {
              if (!ticketMap.has(singleId)) {
                ticketMap.set(singleId, {
                  ticketId: singleId,
                  summary: t.summary || undefined,
                  url: `${baseUrl}${singleId}`
                });
              }
            }
          }
        }
      }
    }

    return Array.from(ticketMap.values());
  }

  /**
   * Broadcasts daily deployment reminders to MS Teams, Telegram, Slack & Email.
   */
  async handleDailyReminder(force = false, currentUsername?: string, targetDateInput?: Date | string) {
    // 1. Resolve exact target date string in Vietnam Timezone (Asia/Ho_Chi_Minh)
    let dateStr = '';
    if (typeof targetDateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(targetDateInput)) {
      dateStr = targetDateInput.slice(0, 10);
    } else {
      const targetObj = targetDateInput ? new Date(targetDateInput) : new Date();
      dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(targetObj);
    }

    if (!force && this.lastSentDateStr === dateStr) {
      this.logger.debug(`Daily deployment reminder for ${dateStr} has already been sent automatically.`);
      return { success: false, count: 0, message: `Daily deployment reminder for ${dateStr} has already been sent automatically.` };
    }

    this.logger.log(`Scanning deployment schedules for date: ${dateStr} (Force: ${force})...`);

    // 2. Build precise 24-hour UTC boundary for Vietnam Time (+07:00)
    const dayStart = new Date(`${dateStr}T00:00:00.000+07:00`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999+07:00`);

    const windows = await this.prisma.deploymentWindow.findMany({
      where: {
        startTime: {
          gte: dayStart,
          lte: dayEnd,
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
      orderBy: { startTime: 'asc' }
    });

    if (windows.length === 0) {
      const msg = `No active deployment schedules found for ${dateStr}.`;
      this.logger.log(msg);
      return { success: false, count: 0, message: msg };
    }

    // 3. Resolve user to mention
    let mentionUser = currentUsername;
    if (!mentionUser) {
      const defaultUser = await this.prisma.user.findFirst();
      mentionUser = defaultUser?.username || 'ReleaseManager';
    }

    this.logger.log(`Found ${windows.length} deployment(s) scheduled for ${dateStr}. Building notifications...`);

    const targetDateObj = new Date(`${dateStr}T12:00:00.000+07:00`);
    const formattedDateStr = targetDateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // 4. Construct Notification Payloads
    let telegramMsg = `🚀 <b>Deployment Reminder</b>\n\n`;
    telegramMsg += `📅 Scheduled deployments for <b>${formattedDateStr}</b>:\n\n`;

    let plainMsg = `🚀 **Deployment Reminder**\n\n`;
    plainMsg += `📅 Scheduled deployments for **${formattedDateStr}**:\n\n`;

    let emailHtml = `<div style="font-family: Arial, sans-serif; line-height: 1.6;">`;

    for (const win of windows) {
      // Format 24h local time in Asia/Ho_Chi_Minh
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Ho_Chi_Minh'
      }).format(new Date(win.startTime));

      const envName = win.environment.name;
      const releasePackage = win.bookings?.[0]?.releasePackage;
      const version = releasePackage?.version || 'Release ' + envName;
      const releasePackageId = releasePackage?.id;

      // Get related tickets
      const tickets = await this.getTicketsForFixVersion(releasePackageId, version);

      // Telegram Message block
      telegramMsg += `🏢 <b>[${envName}]</b> <b>Version:</b> ${version}\n`;
      telegramMsg += `⏰ <b>Build Time:</b> ${timeStr} (VN Time)\n`;
      telegramMsg += `📋 <b>Related Tickets (${tickets.length}):</b>\n`;

      // Plain / Teams / Slack Message block
      plainMsg += `🏢 **[${envName}]** **Version:** ${version}\n`;
      plainMsg += `⏰ **Build Time:** ${timeStr} (VN Time)\n`;
      plainMsg += `📋 **Related Tickets (${tickets.length}):**\n`;

      // Email HTML block
      emailHtml += `
        <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 14px 18px; margin-bottom: 16px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 6px; color: #0f172a; font-size: 15px;">[${envName}] ${version} — <span style="color: #4f46e5;">${timeStr}</span></h3>
          <p style="margin: 0 0 10px; font-size: 12.5px; color: #64748b;"><strong>Date:</strong> ${formattedDateStr}</p>
          <div style="font-size: 12.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">Related Jira Tickets:</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px;">
      `;

      if (tickets.length > 0) {
        tickets.forEach(t => {
          telegramMsg += `  • <a href="${t.url}">${t.ticketId}</a>${t.summary ? ` - ${t.summary}` : ''}\n`;
          plainMsg += `  - [${t.ticketId}](${t.url})${t.summary ? ` - ${t.summary}` : ''}\n`;
          emailHtml += `<li style="margin-bottom: 3px;"><a href="${t.url}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">${t.ticketId}</a>${t.summary ? ` - ${t.summary}` : ''}</li>`;
        });
      } else {
        telegramMsg += `  • <i>No specific tickets linked to this build window.</i>\n`;
        plainMsg += `  - No specific tickets linked to this build window.\n`;
        emailHtml += `<li style="color: #94a3b8; font-style: italic;">No specific tickets linked to this build window.</li>`;
      }

      telegramMsg += `\n`;
      plainMsg += `\n`;
      emailHtml += `</ul></div>`;
    }

    telegramMsg += `👤 <b>Release Manager:</b> @${mentionUser}`;
    plainMsg += `👤 Release Manager: @${mentionUser}`;
    emailHtml += `</div>`;

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.05); background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
          <h2 style="color: #4f46e5; margin: 0; font-size: 20px;">🚀 Deployment Schedule Reminder</h2>
          <p style="color: #64748b; margin-top: 4px; font-size: 13px;">Release Flow Platform Automated Alert</p>
        </div>
        <p style="font-size: 14px; color: #334155;">Hello <strong>@${mentionUser}</strong>, here is today's deployment schedule for <strong>${formattedDateStr}</strong>:</p>
        ${emailHtml}
        <div style="margin-top: 24px; padding-top: 14px; border-top: 1px dashed #e2e8f0; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">Automated notification generated by Release Flow Platform Scheduler.</p>
        </div>
      </div>
    `;

    try {
      await Promise.allSettled([
        this.notificationsService.sendTelegramNotification(telegramMsg),
        this.notificationsService.sendSlackNotification(plainMsg),
        this.notificationsService.sendTeamsNotification('🚀 Deployment Reminder', plainMsg, mentionUser),
        this.notificationsService.sendEmailNotification('[Release Flow] 🚀 Deployment Reminder', emailBody)
      ]);
      this.lastSentDateStr = dateStr;
      this.logger.log(`Broadcasted deployment reminder for ${dateStr} successfully.`);
      
      return {
        success: true,
        count: windows.length,
        message: `Deployment reminder for ${formattedDateStr} (${windows.length} deployment(s)) sent to Teams, Telegram & Slack!`
      };
    } catch (err) {
      this.logger.error('Failed to broadcast daily reminder', err);
      return { success: false, count: windows.length, message: 'Error broadcasting deployment reminder notification.' };
    }
  }

  async handleTomorrowReminder(currentUsername?: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await this.handleDailyReminder(true, currentUsername, tomorrow);
  }
}
