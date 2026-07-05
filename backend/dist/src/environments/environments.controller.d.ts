import { EnvironmentsService } from './environments.service';
export declare class EnvironmentsController {
    private readonly environmentsService;
    constructor(environmentsService: EnvironmentsService);
    findAll(): Promise<{
        id: number;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(body: {
        name: string;
        description?: string;
    }): Promise<{
        id: number;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: number;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
