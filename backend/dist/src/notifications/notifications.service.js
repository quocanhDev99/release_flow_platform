"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    logger = new common_1.Logger(NotificationsService_1.name);
    async sendSlackNotification(message) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send Slack notification: ${error.message}`);
            return false;
        }
    }
    async sendTeamsNotification(title, message) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send Teams notification: ${error.message}`);
            return false;
        }
    }
    async sendDeploymentAlert(data) {
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
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map