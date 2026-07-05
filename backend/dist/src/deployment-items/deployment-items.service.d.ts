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
                id: number;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                version: string;
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
            builds: ({
                environment: {
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                };
            } & {
                id: number;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                deploymentItemId: number;
                buildNumber: string | null;
                buildUrl: string | null;
                builtAt: Date;
                environmentId: number;
            })[];
        } & {
            id: number;
            sourceBranch: string;
            status: string;
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
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            version: string;
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
        builds: ({
            environment: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            deploymentItemId: number;
            buildNumber: string | null;
            buildUrl: string | null;
            builtAt: Date;
            environmentId: number;
        })[];
    } & {
        id: number;
        sourceBranch: string;
        status: string;
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
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            version: string;
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
        builds: ({
            environment: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            deploymentItemId: number;
            buildNumber: string | null;
            buildUrl: string | null;
            builtAt: Date;
            environmentId: number;
        })[];
    } & {
        id: number;
        sourceBranch: string;
        status: string;
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
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            version: string;
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
        builds: ({
            environment: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            deploymentItemId: number;
            buildNumber: string | null;
            buildUrl: string | null;
            builtAt: Date;
            environmentId: number;
        })[];
    } & {
        id: number;
        sourceBranch: string;
        status: string;
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
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            version: string;
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
        builds: ({
            environment: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            deploymentItemId: number;
            buildNumber: string | null;
            buildUrl: string | null;
            builtAt: Date;
            environmentId: number;
        })[];
    } & {
        id: number;
        sourceBranch: string;
        status: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }>;
    bulkCreate(items: any[]): Promise<{
        id: number;
        sourceBranch: string;
        status: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }[]>;
    remove(id: number): Promise<{
        id: number;
        sourceBranch: string;
        status: string;
        isMergedOnDevel: boolean;
        mergedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        repositoryId: number;
        userId: number;
        releaseStreamId: number | null;
    }>;
}
