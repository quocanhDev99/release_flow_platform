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
exports.DeploymentItemsController = void 0;
const common_1 = require("@nestjs/common");
const deployment_items_service_1 = require("./deployment-items.service");
let DeploymentItemsController = class DeploymentItemsController {
    deploymentItemsService;
    constructor(deploymentItemsService) {
        this.deploymentItemsService = deploymentItemsService;
    }
    findAll(page, pageSize, search, repoName, releaseVersion, qcStatus, status, branchBuild, sortBy, sortOrder) {
        return this.deploymentItemsService.findAll({
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
            search,
            repoName,
            releaseVersion,
            qcStatus,
            status,
            branchBuild,
            sortBy,
            sortOrder: (sortOrder === 'asc' || sortOrder === 'desc') ? sortOrder : undefined,
        });
    }
    bulkCreate(items) {
        return this.deploymentItemsService.bulkCreate(items);
    }
    findOne(id) {
        return this.deploymentItemsService.findOne(id);
    }
    create(data) {
        return this.deploymentItemsService.create(data);
    }
    update(id, data) {
        return this.deploymentItemsService.update(id, data);
    }
    patchMergeDevel(id, isMergedOnDevel) {
        return this.deploymentItemsService.patchMergeDevel(id, isMergedOnDevel);
    }
    remove(id) {
        return this.deploymentItemsService.remove(id);
    }
};
exports.DeploymentItemsController = DeploymentItemsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('repoName')),
    __param(4, (0, common_1.Query)('releaseVersion')),
    __param(5, (0, common_1.Query)('qcStatus')),
    __param(6, (0, common_1.Query)('status')),
    __param(7, (0, common_1.Query)('branchBuild')),
    __param(8, (0, common_1.Query)('sortBy')),
    __param(9, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], DeploymentItemsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('bulk'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], DeploymentItemsController.prototype, "bulkCreate", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DeploymentItemsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeploymentItemsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], DeploymentItemsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/merge-devel'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('isMergedOnDevel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Boolean]),
    __metadata("design:returntype", void 0)
], DeploymentItemsController.prototype, "patchMergeDevel", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DeploymentItemsController.prototype, "remove", null);
exports.DeploymentItemsController = DeploymentItemsController = __decorate([
    (0, common_1.Controller)('deployment-items'),
    __metadata("design:paramtypes", [deployment_items_service_1.DeploymentItemsService])
], DeploymentItemsController);
//# sourceMappingURL=deployment-items.controller.js.map