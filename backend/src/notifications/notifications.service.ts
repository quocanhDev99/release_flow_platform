/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  async sendSlackNotification(message: string): Promise<boolean> {
    const dbWebhookUrl = await this.settingsService.getSetting('SLACK_WEBHOOK_URL');
    const webhookUrl = dbWebhookUrl || process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      this.logger.warn('SLACK_WEBHOOK_URL is not configured.');
      return false;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });

      if (!response.ok) {
        throw new Error(`Slack API responded with status ${response.status}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to send Slack notification: ${error.message}`);
      return false;
    }
  }

  async sendTeamsNotification(
    title: string,
    message: string,
    developerUsername?: string
  ): Promise<boolean> {
    const dbWebhookUrl = await this.settingsService.getSetting('TEAMS_WEBHOOK_URL');
    const webhookUrl = dbWebhookUrl || process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) {
      this.logger.warn('TEAMS_WEBHOOK_URL is not configured.');
      return false;
    }

    let finalMessage = message;
    const msteamsEntities: any[] = [];

    if (developerUsername) {
      const user = await this.prisma.user.findUnique({ where: { username: developerUsername } });
      if (user && user.email) {
        // Replace "@username" with "<at>username</at>"
        finalMessage = finalMessage.replace(`@${developerUsername}`, `<at>${developerUsername}</at>`);
        msteamsEntities.push({
          type: 'mention',
          text: `<at>${developerUsername}</at>`,
          mentioned: {
            id: user.email,
            name: developerUsername,
          },
        });
      }
    }

    try {
      const payload: any = {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            contentUrl: null,
            content: {
              $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
              type: 'AdaptiveCard',
              version: '1.2',
              body: [
                {
                  type: 'TextBlock',
                  text: title,
                  weight: 'bolder',
                  size: 'Medium',
                },
                {
                  type: 'TextBlock',
                  text: finalMessage,
                  wrap: true,
                },
              ],
            },
          },
        ],
      };

      if (msteamsEntities.length > 0) {
        payload.attachments[0].content.msteams = { entities: msteamsEntities };
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Teams API responded with status ${response.status}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to send Teams notification: ${error.message}`);
      return false;
    }
  }

  async sendTelegramNotification(message: string): Promise<boolean> {
    const dbBotToken = await this.settingsService.getSetting('TELEGRAM_BOT_TOKEN');
    const dbChatId = await this.settingsService.getSetting('TELEGRAM_CHAT_ID');
    
    const botToken = dbBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = dbChatId || process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      this.logger.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured.');
      return false;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML' // Using HTML to allow bold, links, etc.
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API responded with status ${response.status}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to send Telegram notification: ${error.message}`);
      return false;
    }
  }

  async sendEmailNotification(subject: string, htmlBody: string): Promise<boolean> {
    const dbHost = await this.settingsService.getSetting('SMTP_HOST');
    const dbPort = await this.settingsService.getSetting('SMTP_PORT');
    const dbUser = await this.settingsService.getSetting('SMTP_USER');
    const dbPass = await this.settingsService.getSetting('SMTP_PASS');
    const dbFrom = await this.settingsService.getSetting('SMTP_FROM');
    const dbTo = await this.settingsService.getSetting('SMTP_TO');

    const host = dbHost || process.env.SMTP_HOST;
    const port = dbPort ? parseInt(dbPort) : (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587);
    const user = dbUser || process.env.SMTP_USER;
    const pass = dbPass || process.env.SMTP_PASS;
    const from = dbFrom || process.env.SMTP_FROM || user;
    const to = dbTo || process.env.SMTP_TO || user; 

    if (!host || !user || !pass) {
      this.logger.warn('SMTP credentials are not fully configured.');
      return false;
    }

    try {
      // Lazy load nodemailer to avoid startup issues if not installed yet
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlBody,
      });
      
      this.logger.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send Email notification: ${error.message}`);
      return false;
    }
  }

  sendDeploymentAlert(data: {
    repoName: string;
    ticketId: string;
    summary: string;
    changeType: string;
    releaseVersion: string;
    sourceBranch: string;
    developer: string;
    url?: string;
    actionType?: 'CREATED' | 'UPDATED' | 'DELETED' | 'MERGED';
  }) {
    const action = data.actionType || 'CREATED';
    let actionText = 'New deployment record created!';
    let emoji = '🚀';
    
    if (action === 'UPDATED') { actionText = 'Deployment record updated'; emoji = '✏️'; }
    else if (action === 'DELETED') { actionText = 'Deployment record deleted'; emoji = '🗑️'; }
    else if (action === 'MERGED') { actionText = 'Deployment branch merged on devel'; emoji = '✅'; }

    const slackMessage = `${emoji} *[RFP Alert]* ${actionText}
• *Repository:* ${data.repoName}
• *Ticket:* <${data.url || '#'}|${data.ticketId}> - ${data.summary}
• *Change Type:* ${data.changeType}
• *Release Version:* ${data.releaseVersion}
• *Branch:* \`${data.sourceBranch}\`
• *Developer:* @${data.developer}`;

    const teamsMessage = `**Action:** ${actionText}  \n**Repository:** ${data.repoName}  \n**Ticket:** [${data.ticketId}](${data.url || '#'}) - ${data.summary}  \n**Change Type:** ${data.changeType}  \n**Release Version:** ${data.releaseVersion}  \n**Branch:** \`${data.sourceBranch}\`  \n**Developer:** @${data.developer}`;

    const telegramMessage = `${emoji} <b>[RFP Alert] ${actionText}</b>\n\n` +
      `📦 <b>Repository:</b> ${data.repoName}\n` +
      `🎫 <b>Ticket:</b> <a href="${data.url || '#'}">${data.ticketId}</a> - ${data.summary}\n` +
      `🏷 <b>Change Type:</b> ${data.changeType}\n` +
      `🚀 <b>Release Version:</b> ${data.releaseVersion}\n` +
      `🌿 <b>Branch:</b> <code>${data.sourceBranch}</code>\n` +
      `🧑‍💻 <b>Developer:</b> @${data.developer}`;

    const emailSubject = `[Release Flow] ${actionText} - ${data.repoName} (${data.ticketId})`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
        <h2 style="color: #2c3e50; margin-top: 0;">${emoji} ${actionText}</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; background: #f9f9f9; width: 30%;"><strong>Repository</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.repoName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; background: #f9f9f9;"><strong>Ticket</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="${data.url || '#'}">${data.ticketId}</a> ${data.summary ? `- ${data.summary}` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; background: #f9f9f9;"><strong>Type</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.changeType}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; background: #f9f9f9;"><strong>Release Version</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.releaseVersion}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; background: #f9f9f9;"><strong>Branch</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><code>${data.sourceBranch}</code></td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; background: #f9f9f9;"><strong>Developer</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">@${data.developer}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 12px; color: #888;">This is an automated notification from Release Flow Platform.</p>
      </div>
    `;

    return Promise.all([
      this.sendSlackNotification(slackMessage),
      this.sendTeamsNotification(`RFP Alert - ${data.repoName} (${data.ticketId})`, teamsMessage, data.developer),
      this.sendTelegramNotification(telegramMessage),
      this.sendEmailNotification(emailSubject, emailBody)
    ]).then(() => {}).catch(err => this.logger.error('Error during broadcast notification', err));
  }

  sendBulkDeploymentAlert(data: {
    actionType: 'UPDATED' | 'DELETED' | 'IMPORTED';
    count: number;
    developer: string;
  }) {
    let actionText = 'Bulk update performed';
    let emoji = '🔄';
    if (data.actionType === 'DELETED') {
      actionText = 'Bulk delete performed';
      emoji = '🗑️';
    } else if (data.actionType === 'IMPORTED') {
      actionText = 'Bulk data imported';
      emoji = '📥';
    }

    const message = `${emoji} <b>[RFP Bulk Alert] ${actionText}</b>\n\n` +
      `🔢 <b>Records affected:</b> ${data.count}\n` +
      `🧑‍💻 <b>Triggered by:</b> @${data.developer}`;

    const plainMessage = message.replace(/<[^>]*>?/gm, '');

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
        <h2 style="color: #2c3e50; margin-top: 0;">${emoji} ${actionText}</h2>
        <p>A bulk operation was performed affecting <strong>${data.count}</strong> records.</p>
        <p>Triggered by: @${data.developer}</p>
        <p style="margin-top: 20px; font-size: 12px; color: #888;">This is an automated notification from Release Flow Platform.</p>
      </div>
    `;

    return Promise.all([
      this.sendSlackNotification(plainMessage),
      this.sendTeamsNotification(`RFP Bulk Alert`, plainMessage, data.developer),
      this.sendTelegramNotification(message),
      this.sendEmailNotification(`[Release Flow] Bulk ${data.actionType} Alert`, emailBody)
    ]).then(() => {}).catch(err => this.logger.error('Error during bulk broadcast notification', err));
  }

  sendScheduleAlert(data: {
    actionType: 'CREATED' | 'UPDATED' | 'DELETED' | 'IMPORTED';
    envName?: string;
    startTime?: string;
    version?: string;
    count?: number;
    developer: string;
  }) {
    let actionText = 'Deployment schedule created';
    let emoji = '📅';
    if (data.actionType === 'UPDATED') {
      actionText = 'Deployment schedule updated';
      emoji = '✏️';
    } else if (data.actionType === 'DELETED') {
      actionText = 'Deployment schedule deleted';
      emoji = '🗑️';
    } else if (data.actionType === 'IMPORTED') {
      actionText = 'AI Schedules imported';
      emoji = '🤖';
    }

    let message = `${emoji} <b>[RFP Scheduler] ${actionText}</b>\n\n`;
    let plainMessage = `${emoji} [RFP Scheduler] ${actionText}\n\n`;

    if (data.actionType === 'IMPORTED' && data.count) {
      message += `🔢 <b>Schedules Extracted:</b> ${data.count}\n`;
      plainMessage += `Schedules Extracted: ${data.count}\n`;
    } else {
      message += `🌍 <b>Environment:</b> ${data.envName || 'Unknown'}\n`;
      message += `⏰ <b>Build Time:</b> ${data.startTime || 'Unknown'}\n`;
      message += `🏷 <b>Version:</b> ${data.version || 'Unknown'}\n`;

      plainMessage += `Environment: ${data.envName || 'Unknown'}\n`;
      plainMessage += `Build Time: ${data.startTime || 'Unknown'}\n`;
      plainMessage += `Version: ${data.version || 'Unknown'}\n`;
    }

    message += `🧑‍💻 <b>Triggered by:</b> @${data.developer}`;
    plainMessage += `Triggered by: @${data.developer}`;

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; margin: 0;">${emoji} ${actionText}</h2>
          <p style="color: #666; margin-top: 5px; font-size: 14px;">Release Flow Platform Scheduler</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #eee;">
          ${data.actionType === 'IMPORTED'
            ? `
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #eee; background: #f8f9fa; width: 40%; color: #495057;"><strong>Schedules Extracted</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #212529;"><strong>${data.count}</strong> records</td>
              </tr>
              `
            : `
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #eee; background: #f8f9fa; width: 40%; color: #495057;"><strong>Environment</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #212529;">${data.envName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #eee; background: #f8f9fa; color: #495057;"><strong>Build Time</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #212529;">${data.startTime}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #eee; background: #f8f9fa; color: #495057;"><strong>Version</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #212529;"><code style="background: #f1f3f5; padding: 2px 6px; border-radius: 4px; font-size: 13px;">${data.version}</code></td>
              </tr>
              `
          }
          <tr>
            <td style="padding: 12px 15px; background: #f8f9fa; color: #495057;"><strong>Triggered by</strong></td>
            <td style="padding: 12px 15px; color: #0d6efd;">@${data.developer}</td>
          </tr>
        </table>
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px dashed #eee; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #999;">This is an automated notification.</p>
          <p style="margin: 5px 0 0; font-size: 12px; color: #999;">Please do not reply directly to this email.</p>
        </div>
      </div>
    `;

    return Promise.all([
      this.sendSlackNotification(plainMessage),
      this.sendTeamsNotification(`RFP Scheduler Alert`, plainMessage, data.developer),
      this.sendTelegramNotification(message),
      this.sendEmailNotification(`[Release Flow] Scheduler ${data.actionType} Alert`, emailBody)
    ]).then(() => {}).catch(err => this.logger.error('Error during schedule broadcast notification', err));
  }
}
