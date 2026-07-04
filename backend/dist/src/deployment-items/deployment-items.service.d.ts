import { PrismaService } from '../prisma/prisma.service';
export declare class DeploymentItemsService {
    private prisma;
    constructor(prisma: PrismaService);
    private resolveReleaseStreamId;
    findAll(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
        repoName?: string;
        releaseVersion?: string;
        qcStatus?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
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
                password: string;
                theme: string;
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
            password: string;
            theme: string;
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
    create(data: any): Promise<({
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
            password: string;
            theme: string;
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
            password: string;
            theme: string;
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
            password: string;
            theme: string;
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
