/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeploymentItemsService } from '../deployment-items/deployment-items.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private deploymentItemsService: DeploymentItemsService,
    private notificationsService: NotificationsService,
  ) {}

  private extractTicketId(text: string): string | null {
    const match = text.match(/MAG-\d+/i);
    return match ? match[0].toUpperCase() : null;
  }

  private resolveReleaseVersion(baseBranch: string): string {
    const cleanBranch = baseBranch.trim().toLowerCase();

    // release/1.12 -> sow/1.12.x
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

  async handleGitHubWebhook(headers: any, payload: any) {
    const event = headers['x-github-event'];
    if (event !== 'pull_request') {
      this.logger.log(`Skipping GitHub event: ${event}`);
      return { skipped: true, reason: `Not a pull_request event` };
    }

    const { action, pull_request, repository } = payload;
    if (action !== 'closed' || !pull_request?.merged) {
      this.logger.log(
        `Skipping GitHub PR action: ${action} (merged: ${pull_request?.merged})`,
      );
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

  async handleBitbucketWebhook(headers: any, payload: any) {
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
    const author =
      pullrequest?.author?.username || actor?.username || 'bitbucket_user';

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

  private async processMergedPR(data: {
    repoName: string;
    prTitle: string;
    prLink: string;
    sourceBranch: string;
    baseBranch: string;
    author: string;
    source: string;
  }) {
    const {
      repoName,
      prTitle,
      prLink,
      sourceBranch,
      baseBranch,
      author,
      source,
    } = data;

    // 1. Extract Ticket ID
    const ticketId =
      this.extractTicketId(prTitle) || this.extractTicketId(sourceBranch);
    if (!ticketId) {
      this.logger.warn(
        `Could not extract Ticket ID from PR Title: "${prTitle}" or Source Branch: "${sourceBranch}"`,
      );
      return { skipped: true, reason: 'No ticket ID (MAG-xxxxx) found' };
    }

    // 2. Resolve Release Version
    const releaseVersion = this.resolveReleaseVersion(baseBranch);

    // 3. Find or Create Repository
    let dbRepo = await this.prisma.repository.findFirst({
      where: { name: { equals: repoName, mode: 'insensitive' } },
    });
    if (!dbRepo) {
      dbRepo = await this.prisma.repository.create({
        data: { name: repoName },
      });
    }

    // 4. Find or Create User
    let dbUser = await this.prisma.user.findFirst({
      where: { username: { equals: author, mode: 'insensitive' } },
    });
    if (!dbUser) {
      dbUser = await this.prisma.user.create({
        data: {
          username: author,
          email: `${author}@example.com`,
          password: 'external_oauth_user', // placeholder
        },
      });
    }

    // 5. Check for duplicate ticket in same repo & release version (using direct loose check on version text)
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
        deploymentItems: {
          some: {
            repositories: { some: { id: dbRepo.id } },
            releasePackage: {
              version: { contains: cleanVer, mode: 'insensitive' },
            },
          },
        },
      },
    });

    if (existingTicket) {
      this.logger.log(
        `Skipping duplicate deployment for ticket ${ticketId} in repo ${repoName} for release ${releaseVersion}`,
      );
      return {
        skipped: true,
        reason: 'Duplicate deployment record already exists',
      };
    }

    // 7. Create Deployment Item & Ticket via DeploymentItemsService
    const createdItem = await this.deploymentItemsService.create({
      sourceBranch,
      status: 'merged',
      isMergedOnDevel: true, // Auto-mark as merged on development since PR is merged
      repositoryIds: [dbRepo.id],
      userId: dbUser.id,
      releaseVersion,
      tickets: [
        {
          ticketId,
          summary: prTitle,
          changeType:
            prTitle.toLowerCase().includes('fix') ||
            prTitle.toLowerCase().includes('bug')
              ? 'Fix bug'
              : 'Feature',
          qcStatus: 'Waiting',
        },
      ],
    });

    // 8. Fire Alert Notifications
    await this.notificationsService.sendDeploymentAlert({
      repoName: dbRepo.name,
      ticketId,
      summary: prTitle,
      changeType:
        prTitle.toLowerCase().includes('fix') ||
        prTitle.toLowerCase().includes('bug')
          ? 'Fix bug'
          : 'Feature',
      releaseVersion,
      sourceBranch,
      developer: author,
      url: prLink,
    });

    this.logger.log(
      `Successfully created deployment for ticket ${ticketId} via ${source} Webhook.`,
    );
    return { success: true, deploymentItemId: createdItem?.id || null };
  }
}
