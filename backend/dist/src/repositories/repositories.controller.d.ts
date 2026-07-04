import { PrismaService } from '../prisma/prisma.service';
export declare class RepositoriesController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: number;
        name: string;
        gitUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(body: {
        name: string;
        gitUrl?: string;
    }): import("@prisma/client").Prisma.Prisma__RepositoryClient<{
        id: number;
        name: string;
        gitUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        gitUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
