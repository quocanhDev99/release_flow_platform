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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoriesController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RepositoriesController = class RepositoriesController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.repository.findMany({
            orderBy: { name: 'asc' },
        });
    }
    create(body) {
        return this.prisma.repository.create({
            data: {
                name: body.name,
                gitUrl: body.gitUrl || `https://github.com/quocanhDev99/release_flow_platform_${body.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.git`,
            },
        });
    }
    async remove(id) {
        return this.prisma.$transaction(async (tx) => {
            const items = await tx.deploymentItem.findMany({
                where: { repositoryId: id },
                select: { id: true },
            });
            const itemIds = items.map(item => item.id);
            if (itemIds.length > 0) {
                await tx.ticket.deleteMany({
                    where: { deploymentItemId: { in: itemIds } },
                });
                await tx.build.deleteMany({
                    where: { deploymentItemId: { in: itemIds } },
                });
                await tx.deploymentItem.deleteMany({
                    where: { id: { in: itemIds } },
                });
            }
            return tx.repository.delete({
                where: { id },
            });
        });
    }
};
exports.RepositoriesController = RepositoriesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RepositoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RepositoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RepositoriesController.prototype, "remove", null);
exports.RepositoriesController = RepositoriesController = __decorate([
    (0, common_1.Controller)('repositories'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RepositoriesController);
//# sourceMappingURL=repositories.controller.js.map