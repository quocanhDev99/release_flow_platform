import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendSlackNotification(message: string): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
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

  async sendTeamsNotification(title: string, message: string): Promise<boolean> {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) {
      this.logger.warn('TEAMS_WEBHOOK_URL is not configured.');
      return false;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          themeColor: '3b82f6',
          summary: title,
          sections: [
            {
              activityTitle: title,
              activitySubtitle: new Date().toLocaleString(),
              text: message,
            },
          ],
        }),
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

  async sendDeploymentAlert(data: {
    repoName: string;
    ticketId: string;
    summary: string;
    changeType: string;
    releaseVersion: string;
    sourceBranch: string;
    developer: string;
    url?: string;
  }) {
    const slackMessage = `🚀 *[RFP Alert]* New deployment record created!
• *Repository:* ${data.repoName}
• *Ticket:* <${data.url || '#'}|${data.ticketId}> - ${data.summary}
• *Change Type:* ${data.changeType}
• *Release Version:* ${data.releaseVersion}
• *Branch:* \`${data.sourceBranch}\`
• *Developer:* @${data.developer}`;

    const teamsMessage = `**Repository:** ${data.repoName}  \n**Ticket:** [${data.ticketId}](${data.url || '#'}) - ${data.summary}  \n**Change Type:** ${data.changeType}  \n**Release Version:** ${data.releaseVersion}  \n**Branch:** \`${data.sourceBranch}\`  \n**Developer:** @${data.developer}`;

    await this.sendSlackNotification(slackMessage);
    await this.sendTeamsNotification(`New Deployment - ${data.repoName} (${data.ticketId})`, teamsMessage);
  }
}
