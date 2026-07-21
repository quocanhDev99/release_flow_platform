import { Controller, Get, Post, Body, Inject, forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService
  ) {}

  @Get()
  async getSettings() {
    return this.settingsService.getAllSettings();
  }

  @Post('bulk')
  async updateSettings(@Body() data: Record<string, string>) {
    return this.settingsService.bulkUpdateSettings(data);
  }

  @Post('test-notification')
  async testNotification(@Body() data: { type: 'telegram' | 'email' | 'teams' | 'slack' }) {
    if (data.type === 'telegram') {
      const success = await this.notificationsService.sendTelegramNotification('🧪 <b>Test Notification</b>\n\nThis is a test message from Release Flow Platform Settings.');
      if (!success) {
        throw new Error('Failed to send Telegram notification. Check your configuration.');
      }
      return { success: true };
    } else if (data.type === 'email') {
      const success = await this.notificationsService.sendEmailNotification(
        '[Release Flow] Test Notification',
        '<h2>Test Notification</h2><p>This is a test email from Release Flow Platform Settings.</p>'
      );
      if (!success) {
        throw new Error('Failed to send Email notification. Check your configuration.');
      }
      return { success: true };
    } else if (data.type === 'teams') {
      try {
        await this.notificationsService.sendTeamsNotification('🧪 Test Notification', 'This is a test message from Release Flow Platform Settings.');
        return { success: true };
      } catch (err) {
        throw new Error('Failed to send Teams notification. Check your Webhook URL.');
      }
    } else if (data.type === 'slack') {
      try {
        await this.notificationsService.sendSlackNotification('🧪 *Test Notification*\n\nThis is a test message from Release Flow Platform Settings.');
        return { success: true };
      } catch (err) {
        throw new Error('Failed to send Slack notification. Check your Webhook URL.');
      }
    }
    throw new Error('Invalid notification type');
  }
}
