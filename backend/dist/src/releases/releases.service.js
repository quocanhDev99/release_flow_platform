"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReleasesService = class ReleasesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const releases = await this.prisma.releaseStream.findMany();
        const versionMap = new Map();
        for (const r of releases) {
            const match = r.version.match(/\d+(\.\d+)+/);
            const cleanVer = match ? match[0] : r.version;
            if (!versionMap.has(cleanVer)) {
                versionMap.set(cleanVer, r.id);
            }
        }
        const sortedVersions = Array.from(versionMap.entries()).sort((a, b) => {
            const matchA = a[0].match(/\d+(\.\d+)+/);
            const matchB = b[0].match(/\d+(\.\d+)+/);
            if (!matchA && !matchB)
                return a[0].localeCompare(b[0]);
            if (!matchA)
                return 1;
            if (!matchB)
                return -1;
            const partsA = matchA[0].split('.').map(Number);
            const partsB = matchB[0].split('.').map(Number);
            const maxLen = Math.max(partsA.length, partsB.length);
            for (let i = 0; i < maxLen; i++) {
                const valA = partsA[i] !== undefined ? partsA[i] : 0;
                const valB = partsB[i] !== undefined ? partsB[i] : 0;
                if (valA !== valB) {
                    return valA - valB;
                }
            }
            return 0;
        });
        return sortedVersions.map(([version, id]) => ({
            id,
            version,
        }));
    }
    async create(version) {
        return this.prisma.releaseStream.create({
            data: { version },
        });
    }
};
exports.ReleasesService = ReleasesService;
exports.ReleasesService = ReleasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReleasesService);
//# sourceMappingURL=releases.service.js.map