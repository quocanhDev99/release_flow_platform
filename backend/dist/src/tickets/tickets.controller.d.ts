import { TicketsService } from './tickets.service';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
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
