"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentItemsModule = void 0;
const common_1 = require("@nestjs/common");
const deployment_items_service_1 = require("./deployment-items.service");
const deployment_items_controller_1 = require("./deployment-items.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let DeploymentItemsModule = class DeploymentItemsModule {
};
exports.DeploymentItemsModule = DeploymentItemsModule;
exports.DeploymentItemsModule = DeploymentItemsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [deployment_items_controller_1.DeploymentItemsController],
        providers: [deployment_items_service_1.DeploymentItemsService],
    })
], DeploymentItemsModule);
//# sourceMappingURL=deployment-items.module.js.map