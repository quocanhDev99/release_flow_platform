import { DeploymentItemsService } from './deployment-items.service';
export declare class DeploymentItemsController {
    private readonly deploymentItemsService;
    constructor(deploymentItemsService: DeploymentItemsService);
    findAll(page?: string, pageSize?: string, search?: string, repoName?: string, releaseVersion?: string, qcStatus?: string, status?: string, branchBuild?: string, sortBy?: string, sortOrder?: string): Promise<{
        data: ({
            repository: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                gitUrl: string | null;
            };
            user: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                username: string;
                email: string;
                password: string;
                theme: string;
                resetToken: string | null;
                resetTokenExpires: Date | null;
            };
            releaseStream: {
                status: string;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                version: string;
            } | null;
            tickets: {
                qcStatus: string;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                ticketId: string;
                summary: string | null;
                changeType: string;
                pendingIssues: string | null;
                deploymentItemId: number;
            }[];
            builds: ({
                environment: {
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                };
            } & {
                status: string;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                deploymentItemId: number;
                buildNumber: string | null;
                buildUrl: string | null;
                builtAt: Date;
                environmentId: number;
            })[];
        } & {
            status: string;
            id: number;
            sourceBranch: string;
            isMergedOnDevel: boolean;
            mergedAt: Date;
            createdAt: Date;
            updatedAt: Date;
            repositoryId: number;
            userId: number;
            releaseStreamId: number | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    bulkCreate(items: any[]): Promise<{
        status: string;
        id: number;
        sourceBranch: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }[]>;
    findOne(id: number): Promise<({
        repository: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            gitUrl: string | null;
        };
        user: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            email: string;
            password: string;
            theme: string;
            resetToken: string | null;
            resetTokenExpires: Date | null;
        };
        releaseStream: {
            status: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            version: string;
        } | null;
        tickets: {
            qcStatus: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            ticketId: string;
            summary: string | null;
            changeType: string;
            pendingIssues: string | null;
            deploymentItemId: number;
        }[];
        builds: ({
            environment: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            status: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            deploymentItemId: number;
            buildNumber: string | null;
            buildUrl: string | null;
            builtAt: Date;
            environmentId: number;
        })[];
    } & {
        status: string;
        id: number;
        sourceBranch: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }) | null>;
    create(data: any): Promise<({
        repository: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            gitUrl: string | null;
        };
        user: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            email: string;
            password: string;
            theme: string;
            resetToken: string | null;
            resetTokenExpires: Date | null;
        };
        releaseStream: {
            status: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            version: string;
        } | null;
        tickets: {
            qcStatus: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            ticketId: string;
            summary: string | null;
            changeType: string;
            pendingIssues: string | null;
            deploymentItemId: number;
        }[];
        builds: ({
            environment: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            status: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            deploymentItemId: number;
            buildNumber: string | null;
            buildUrl: string | null;
            builtAt: Date;
            environmentId: number;
        })[];
    } & {
        status: string;
        id: number;
        sourceBranch: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }) | null>;
    update(id: number, data: any): Promise<({
        repository: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            gitUrl: string | null;
        };
        user: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            email: string;
            password: string;
            theme: string;
            resetToken: string | null;
            resetTokenExpires: Date | null;
        };
        releaseStream: {
            status: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            version: string;
        } | null;
        tickets: {
            qcStatus: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            ticketId: string;
            summary: string | null;
            changeType: string;
            pendingIssues: string | null;
            deploymentItemId: number;
        }[];
        builds: ({
            environment: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            status: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            deploymentItemId: number;
            buildNumber: string | null;
            buildUrl: string | null;
            builtAt: Date;
            environmentId: number;
        })[];
    } & {
        status: string;
        id: number;
        sourceBranch: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }) | null>;
    patchMergeDevel(id: number, isMergedOnDevel: boolean): Promise<{
        repository: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            gitUrl: string | null;
        };
        user: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            email: string;
            password: string;
            theme: string;
            resetToken: string | null;
            resetTokenExpires: Date | null;
        };
        releaseStream: {
            status: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            version: string;
        } | null;
        tickets: {
            qcStatus: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            ticketId: string;
            summary: string | null;
            changeType: string;
            pendingIssues: string | null;
            deploymentItemId: number;
        }[];
        builds: ({
            environment: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            status: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            deploymentItemId: number;
            buildNumber: string | null;
            buildUrl: string | null;
            builtAt: Date;
            environmentId: number;
        })[];
    } & {
        status: string;
        id: number;
        sourceBranch: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }>;
    remove(id: number): Promise<{
        status: string;
        id: number;
        sourceBranch: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }>;
}
