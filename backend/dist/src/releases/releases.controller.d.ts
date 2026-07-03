import { ReleasesService } from './releases.service';
export declare class ReleasesController {
    private readonly releasesService;
    constructor(releasesService: ReleasesService);
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
}
