import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    handleGitHub(headers: any, payload: any): Promise<{
        success: boolean;
        deploymentItemId: number | null;
        skipped?: undefined;
        reason?: undefined;
    } | {
        skipped: boolean;
        reason: string;
    }>;
    handleBitbucket(headers: any, payload: any): Promise<{
        success: boolean;
        deploymentItemId: number | null;
        skipped?: undefined;
        reason?: undefined;
    } | {
        skipped: boolean;
        reason: string;
        success?: undefined;
        deploymentItemId?: undefined;
    }>;
}
