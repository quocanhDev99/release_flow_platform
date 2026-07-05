import { PrismaService } from '../prisma/prisma.service';
import { DeploymentItemsService } from '../deployment-items/deployment-items.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class WebhooksService {
    private prisma;
    private deploymentItemsService;
    private notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, deploymentItemsService: DeploymentItemsService, notificationsService: NotificationsService);
    private extractTicketId;
    private resolveReleaseVersion;
    handleGitHubWebhook(headers: any, payload: any): Promise<{
        success: boolean;
        deploymentItemId: number | null;
        skipped?: undefined;
        reason?: undefined;
    } | {
        skipped: boolean;
        reason: string;
    }>;
    handleBitbucketWebhook(headers: any, payload: any): Promise<{
        skipped: boolean;
        reason: string;
        success?: undefined;
        deploymentItemId?: undefined;
    } | {
        success: boolean;
        deploymentItemId: number | null;
        skipped?: undefined;
        reason?: undefined;
    }>;
    private processMergedPR;
}
