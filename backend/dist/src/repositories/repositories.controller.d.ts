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
}
