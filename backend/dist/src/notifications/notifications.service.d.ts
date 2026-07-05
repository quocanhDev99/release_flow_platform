export declare class NotificationsService {
    private readonly logger;
    sendSlackNotification(message: string): Promise<boolean>;
    sendTeamsNotification(title: string, message: string): Promise<boolean>;
    sendDeploymentAlert(data: {
        repoName: string;
        ticketId: string;
        summary: string;
        changeType: string;
        releaseVersion: string;
        sourceBranch: string;
        developer: string;
        url?: string;
    }): Promise<void>;
}
