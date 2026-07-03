import { DeploymentItemsService } from './deployment-items.service';
export declare class DeploymentItemsController {
    private readonly deploymentItemsService;
    constructor(deploymentItemsService: DeploymentItemsService);
    findAll(page?: string, pageSize?: string, search?: string, repoName?: string, releaseVersion?: string, qcStatus?: string, status?: string, sortBy?: string, sortOrder?: string): Promise<{
        data: ({
            repository: {
                id: number;
                name: string;
                gitUrl: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            builds: ({
                environment: {
                    id: number;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                };
            } & {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                buildNumber: string | null;
                buildUrl: string | null;
                builtAt: Date;
                environmentId: number;
                deploymentItemId: number;
            })[];
            user: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                username: string;
                email: string;
            };
            releaseStream: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                version: string;
                status: string;
            } | null;
            tickets: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                ticketId: string;
                summary: string | null;
                changeType: string;
                qcStatus: string;
                pendingIssues: string | null;
                deploymentItemId: number;
            }[];
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            sourceBranch: string;
            isMergedOnDevel: boolean;
            mergedAt: Date;
            repositoryId: number;
            userId: number;
            releaseStreamId: number | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    bulkCreate(items: any[]): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        sourceBranch: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }[]>;
    findOne(id: number): Promise<({
        repository: {
            id: number;
            name: string;
            gitUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        builds: ({
            environment: {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            buildNumber: string | null;
            buildUrl: string | null;
            builtAt: Date;
            environmentId: number;
            deploymentItemId: number;
        })[];
        user: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            email: string;
        };
        releaseStream: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            version: string;
            status: string;
        } | null;
        tickets: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            ticketId: string;
            summary: string | null;
            changeType: string;
            qcStatus: string;
            pendingIssues: string | null;
            deploymentItemId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        sourceBranch: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }) | null>;
    create(data: any): Promise<{
        repository: {
            id: number;
            name: string;
            gitUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        builds: ({
            environment: {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            buildNumber: string | null;
            buildUrl: string | null;
            builtAt: Date;
            environmentId: number;
            deploymentItemId: number;
        })[];
        user: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            email: string;
        };
        releaseStream: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            version: string;
            status: string;
        } | null;
        tickets: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            ticketId: string;
            summary: string | null;
            changeType: string;
            qcStatus: string;
            pendingIssues: string | null;
            deploymentItemId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        sourceBranch: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }>;
    update(id: number, data: any): Promise<({
        repository: {
            id: number;
            name: string;
            gitUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        builds: ({
            environment: {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            buildNumber: string | null;
            buildUrl: string | null;
            builtAt: Date;
            environmentId: number;
            deploymentItemId: number;
        })[];
        user: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            email: string;
        };
        releaseStream: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            version: string;
            status: string;
        } | null;
        tickets: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            ticketId: string;
            summary: string | null;
            changeType: string;
            qcStatus: string;
            pendingIssues: string | null;
            deploymentItemId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        sourceBranch: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }) | null>;
    patchMergeDevel(id: number, isMergedOnDevel: boolean): Promise<{
        repository: {
            id: number;
            name: string;
            gitUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        builds: ({
            environment: {
                id: number;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            buildNumber: string | null;
            buildUrl: string | null;
            builtAt: Date;
            environmentId: number;
            deploymentItemId: number;
        })[];
        user: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            email: string;
        };
        releaseStream: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            version: string;
            status: string;
        } | null;
        tickets: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            ticketId: string;
            summary: string | null;
            changeType: string;
            qcStatus: string;
            pendingIssues: string | null;
            deploymentItemId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        sourceBranch: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        sourceBranch: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }>;
}
