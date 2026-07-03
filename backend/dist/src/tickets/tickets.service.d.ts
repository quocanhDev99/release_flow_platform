import { PrismaService } from '../prisma/prisma.service';
export declare class TicketsService {
    private prisma;
    constructor(prisma: PrismaService);
    updateQC(id: number, qcStatus: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        ticketId: string;
        summary: string | null;
        changeType: string;
        qcStatus: string;
        pendingIssues: string | null;
        deploymentItemId: number;
    }>;
}
