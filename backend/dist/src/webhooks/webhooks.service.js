"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const deployment_items_service_1 = require("../deployment-items/deployment-items.service");
const notifications_service_1 = require("../notifications/notifications.service");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    prisma;
    deploymentItemsService;
    notificationsService;
    logger = new common_1.Logger(WebhooksService_1.name);
    constructor(prisma, deploymentItemsService, notificationsService) {
        this.prisma = prisma;
        this.deploymentItemsService = deploymentItemsService;
        this.notificationsService = notificationsService;
    }
    extractTicketId(text) {
        const match = text.match(/MAG-\d+/i);
        return match ? match[0].toUpperCase() : null;
    }
    resolveReleaseVersion(baseBranch) {
        const cleanBranch = baseBranch.trim().toLowerCase();
        const releaseMatch = cleanBranch.match(/release\/(\d+)\.(\d+)/);
        if (releaseMatch) {
            return `sow/${releaseMatch[1]}.${releaseMatch[2]}.x`;
        }
        if (cleanBranch === 'main' || cleanBranch === 'master') {
            return 'sow/main';
        }
        if (cleanBranch === 'dev' || cleanBranch === 'develop') {
            return 'sow/dev';
        }
        return 'sow/unknown';
    }
    async handleGitHubWebhook(headers, payload) {
        const event = headers['x-github-event'];
        if (event !== 'pull_request') {
            this.logger.log(`Skipping GitHub event: ${event}`);
            return { skipped: true, reason: `Not a pull_request event` };
        }
        const { action, pull_request, repository } = payload;
        if (action !== 'closed' || !pull_request?.merged) {
            this.logger.log(`Skipping GitHub PR action: ${action} (merged: ${pull_request?.merged})`);
            return { skipped: true, reason: `PR was not merged` };
        }
        const repoName = repository?.name || 'Core';
        const prTitle = pull_request?.title || '';
        const prLink = pull_request?.html_url || '';
        const sourceBranch = pull_request?.head?.ref || 'main';
        const baseBranch = pull_request?.base?.ref || 'main';
        const author = pull_request?.user?.login || 'github_user';
        return this.processMergedPR({
            repoName,
            prTitle,
            prLink,
            sourceBranch,
            baseBranch,
            author,
            source: 'GitHub',
        });
    }
    async handleBitbucketWebhook(headers, payload) {
        const event = headers['x-event-key'];
        if (event !== 'pullrequest:fulfilled') {
            this.logger.log(`Skipping Bitbucket event: ${event}`);
            return { skipped: true, reason: `Not a pullrequest:fulfilled event` };
        }
        const { pullrequest, repository, actor } = payload;
        const repoName = repository?.name || 'Core';
        const prTitle = pullrequest?.title || '';
        const prLink = pullrequest?.links?.html?.href || '';
        const sourceBranch = pullrequest?.source?.branch?.name || 'main';
        const baseBranch = pullrequest?.destination?.branch?.name || 'main';
        const author = pullrequest?.author?.username || actor?.username || 'bitbucket_user';
        return this.processMergedPR({
            repoName,
            prTitle,
            prLink,
            sourceBranch,
            baseBranch,
            author,
            source: 'Bitbucket',
        });
    }
    async processMergedPR(data) {
        const { repoName, prTitle, prLink, sourceBranch, baseBranch, author, source } = data;
        const ticketId = this.extractTicketId(prTitle) || this.extractTicketId(sourceBranch);
        if (!ticketId) {
            this.logger.warn(`Could not extract Ticket ID from PR Title: "${prTitle}" or Source Branch: "${sourceBranch}"`);
            return { skipped: true, reason: 'No ticket ID (MAG-xxxxx) found' };
        }
        const releaseVersion = this.resolveReleaseVersion(baseBranch);
        let dbRepo = await this.prisma.repository.findFirst({
            where: { name: { equals: repoName, mode: 'insensitive' } },
        });
        if (!dbRepo) {
            dbRepo = await this.prisma.repository.create({
                data: { name: repoName },
            });
        }
        let dbUser = await this.prisma.user.findFirst({
            where: { username: { equals: author, mode: 'insensitive' } },
        });
        if (!dbUser) {
            dbUser = await this.prisma.user.create({
                data: {
                    username: author,
                    email: `${author}@example.com`,
                    password: 'external_oauth_user',
                },
            });
        }
        const cleanVer = releaseVersion
            .replace(/^sow\//i, '')
            .replace(/^som\//i, '')
            .replace(/x$/, '')
            .replace(/^\./, '')
            .replace(/\.$/, '')
            .trim();
        const existingTicket = await this.prisma.ticket.findFirst({
            where: {
                ticketId,
                deploymentItem: {
                    repositoryId: dbRepo.id,
                    releaseStream: {
                        version: { contains: cleanVer, mode: 'insensitive' }
                    }
                },
            },
        });
        if (existingTicket) {
            this.logger.log(`Skipping duplicate deployment for ticket ${ticketId} in repo ${repoName} for release ${releaseVersion}`);
            return { skipped: true, reason: 'Duplicate deployment record already exists' };
        }
        const createdItem = await this.deploymentItemsService.create({
            sourceBranch,
            status: 'merged',
            isMergedOnDevel: true,
            repositoryId: dbRepo.id,
            userId: dbUser.id,
            releaseVersion,
            tickets: [
                {
                    ticketId,
                    summary: prTitle,
                    changeType: prTitle.toLowerCase().includes('fix') || prTitle.toLowerCase().includes('bug') ? 'Fix bug' : 'Feature',
                    qcStatus: 'Waiting',
                },
            ],
        });
        await this.notificationsService.sendDeploymentAlert({
            repoName: dbRepo.name,
            ticketId,
            summary: prTitle,
            changeType: prTitle.toLowerCase().includes('fix') || prTitle.toLowerCase().includes('bug') ? 'Fix bug' : 'Feature',
            releaseVersion,
            sourceBranch,
            developer: author,
            url: prLink,
        });
        this.logger.log(`Successfully created deployment for ticket ${ticketId} via ${source} Webhook.`);
        return { success: true, deploymentItemId: createdItem?.id || null };
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        deployment_items_service_1.DeploymentItemsService,
        notifications_service_1.NotificationsService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map