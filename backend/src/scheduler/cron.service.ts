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

  /**
   * Retrieves all tickets associated with a given Fix Version / Release Package.
   */
  async getTicketsForFixVersion(releasePackageId?: number, versionString?: string): Promise<RelatedTicket[]> {
    if (!releasePackageId && (!versionString || versionString === 'N/A')) return [];

    const match = versionString ? versionString.match(/\d+(\.\d+)+/) : null;
    const cleanVer = match ? match[0] : (versionString || '').trim();

    const whereConditions: any[] = [];
    if (releasePackageId) {
      whereConditions.push({ releasePackageId });
    }
    if (cleanVer) {
      whereConditions.push({
        releasePackage: {
          version: { contains: cleanVer, mode: 'insensitive' }
        }
      });
    }

    if (whereConditions.length === 0) return [];

    const items = await this.prisma.deploymentItem.findMany({
      where: {
        OR: whereConditions
      },
      include: {
        tickets: true,
        releasePackage: true
      }
    });

    // Strictly filter out items whose version doesn't actually match
    const filteredItems = items.filter(item => {
      if (releasePackageId && item.releasePackageId === releasePackageId) return true;
      const itemVer = (item.releasePackage?.version || '').trim();
      if (!itemVer) return false;
      const itemMatch = itemVer.match(/\d+(\.\d+)+/);
      const itemCleanVer = itemMatch ? itemMatch[0] : itemVer;
      return Boolean(cleanVer && itemCleanVer === cleanVer);
    });

    const ticketMap = new Map<string, RelatedTicket>();
    const baseUrl = 'https://storai.atlassian.net/browse/';

    for (const item of filteredItems) {
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

    return Array.from(ticketMap.values());
  }

  async handleDailyReminder(force = false, currentUsername?: string, targetDateInput?: Date | string) {
    const targetDate = targetDateInput ? new Date(targetDateInput) : new Date();
    const dateStr = targetDate.toISOString().slice(0, 10);

    if (!force && this.lastSentDateStr === dateStr) {
      this.logger.debug(`Daily deployment reminder for ${dateStr} has already been sent automatically.`);
      return { success: false, count: 0, message: `Daily deployment reminder for ${dateStr} has already been sent automatically.` };
    }

    this.logger.debug(`Running daily deployment reminder check for ${dateStr}...`);

    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

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
    });

    if (windows.length === 0) {
      const msg = `No active deployment schedules found for ${dateStr}.`;
      this.logger.debug(msg);
      return { success: false, count: 0, message: msg };
    }

    // Resolve user username to mention
    let mentionUser = currentUsername;
    if (!mentionUser) {
      const defaultUser = await this.prisma.user.findFirst();
      mentionUser = defaultUser?.username || 'ReleaseManager';
    }

    this.logger.debug(`Found ${windows.length} deployment(s) scheduled for ${dateStr}. Building deployment reminders...`);

    const formattedDateStr = targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Build notification contents
    let telegramMsg = `🚀 <b>Deployment Reminder</b>\n\n`;
    telegramMsg += `Scheduled deployment plan for ${formattedDateStr}:\n\n`;

    let plainMsg = `🚀 Deployment Reminder\n\n`;
    plainMsg += `Scheduled deployment plan for ${formattedDateStr}:\n\n`;

    let emailHtml = `<div style="font-family: Arial, sans-serif; line-height: 1.6;">`;

    for (const win of windows) {
      const timeStr = new Date(win.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const envName = win.environment.name;
      const releasePackage = win.bookings?.[0]?.releasePackage;
      const version = releasePackage?.version || 'N/A';
      const releasePackageId = releasePackage?.id;

      // Get related tickets strictly for this Fix Version
      const tickets = await this.getTicketsForFixVersion(releasePackageId, version);

      // Telegram Message block
      telegramMsg += `📌 <b>Version:</b> ${version}\n`;
      telegramMsg += `📅 <b>Date:</b> ${formattedDateStr} (${timeStr} - ${envName})\n\n`;
      telegramMsg += `📋 <b>Related Tickets:</b>\n`;

      // Plain / Teams / Slack Message block
      plainMsg += `📌 **Version:** ${version}\n`;
      plainMsg += `📅 **Date:** ${formattedDateStr} (${timeStr} - ${envName})\n\n`;
      plainMsg += `📋 **Related Tickets:**\n`;

      // Email HTML block
      emailHtml += `
        <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #2c3e50;">Version: ${version} (${envName} at ${timeStr})</h3>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${formattedDateStr}</p>
          <h4 style="margin: 12px 0 6px 0; color: #495057;">Related Tickets:</h4>
          <ul style="margin: 0; padding-left: 20px;">
      `;

      if (tickets.length > 0) {
        tickets.forEach(t => {
          telegramMsg += `- <a href="${t.url}">${t.ticketId}</a>${t.summary ? ` (${t.summary})` : ''}\n`;
          plainMsg += `- [${t.ticketId}](${t.url})${t.summary ? ` (${t.summary})` : ''}\n`;
          emailHtml += `<li><a href="${t.url}" style="color: #007bff; text-decoration: none; font-weight: bold;">${t.ticketId}</a>${t.summary ? ` - ${t.summary}` : ''}</li>`;
        });
      } else {
        telegramMsg += `- <i>No tickets linked to Fix Version ${version} yet.</i>\n`;
        plainMsg += `- No tickets linked to Fix Version ${version} yet.\n`;
        emailHtml += `<li style="color: #888; italic;">No tickets linked to Fix Version ${version} yet.</li>`;
      }

      telegramMsg += `\n`;
      plainMsg += `\n`;
      emailHtml += `</ul></div>`;
    }

    telegramMsg += `👤 <b>Mention:</b> @${mentionUser}`;
    plainMsg += `👤 Mention: @${mentionUser}`;
    emailHtml += `</div>`;

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; margin: 0 auto; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f1f3f5; padding-bottom: 15px;">
          <h2 style="color: #2c3e50; margin: 0;">🚀 Deployment Reminder</h2>
          <p style="color: #666; margin-top: 5px; font-size: 14px;">Release Flow Platform Calendar Scheduler</p>
        </div>
        <p style="font-size: 15px; color: #333;">Attention @${mentionUser}, here is the scheduled deployment plan for ${formattedDateStr}:</p>
        ${emailHtml}
        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px dashed #eee; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #999;">Automated notification based on the Deployment Calendar.</p>
        </div>
      </div>
    `;

    try {
      await Promise.all([
        this.notificationsService.sendTelegramNotification(telegramMsg),
        this.notificationsService.sendSlackNotification(plainMsg),
        this.notificationsService.sendTeamsNotification('🚀 Deployment Reminder', plainMsg, mentionUser),
        this.notificationsService.sendEmailNotification('[Release Flow] 🚀 Deployment Reminder', emailBody)
      ]);
      this.lastSentDateStr = dateStr;
      this.logger.log(`Successfully sent deployment reminder with tickets for ${dateStr} (Mentioned @${mentionUser}).`);
      
      return {
        success: true,
        count: windows.length,
        message: `Successfully sent deployment reminder for ${formattedDateStr} (${windows.length} deployment(s)) to Teams & Telegram!`
      };
    } catch (err) {
      this.logger.error('Failed to broadcast daily reminder', err);
      return { success: false, count: windows.length, message: 'Error broadcasting deployment reminder notification.' };
    }
  }

  @Cron('30 16 * * *', { 
    name: 'tomorrow_deployments_reminder',
    timeZone: 'Asia/Ho_Chi_Minh'
  })
  async handleTomorrowReminder(currentUsername?: string) {
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    await this.handleDailyReminder(true, currentUsername, tomorrowStart);
  }
}
