import { PrismaService } from '../prisma/prisma.service';
export declare class ReleasesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: number;
        version: string;
    }[]>;
    create(version: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        version: string;
        status: string;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        version: string;
        status: string;
    }>;
}
