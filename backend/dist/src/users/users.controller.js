"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
let UsersController = class UsersController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.user.findMany({
            orderBy: { username: 'asc' },
            select: { id: true, username: true, email: true, theme: true, createdAt: true, updatedAt: true },
        });
    }
    async register(body) {
        const { username, email, password } = body;
        const existing = await this.prisma.user.findUnique({ where: { username } });
        if (existing) {
            throw new common_1.ConflictException('Username already taken');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: { username, email, password: hashedPassword },
            select: { id: true, username: true, email: true, theme: true, createdAt: true, updatedAt: true },
        });
        return user;
    }
    async login(body) {
        const { username, password } = body;
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid username or password');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Invalid username or password');
        }
        const { password: _pwd, ...safeUser } = user;
        return safeUser;
    }
    async forgotPassword(email) {
        if (!email) {
            throw new common_1.BadRequestException('Email is required');
        }
        const user = await this.prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });
        if (!user) {
            return { message: 'If the email exists, a reset link will be logged.' };
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpires: expires
            }
        });
        console.log('\n==================================================');
        console.log(`[RESET PASSWORD] Link for user: ${user.username} (${user.email})`);
        console.log(`Link: http://localhost:4200/reset-password?token=${token}`);
        console.log('==================================================\n');
        return { message: 'Reset token generated successfully' };
    }
    async resetPassword(body) {
        const { token, password } = body;
        if (!token || !password) {
            throw new common_1.BadRequestException('Token and password are required');
        }
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpires: { gte: new Date() }
            }
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null
            }
        });
        return { message: 'Password reset successfully' };
    }
    updateTheme(id, theme) {
        return this.prisma.user.update({
            where: { id },
            data: { theme },
            select: { id: true, username: true, email: true, theme: true, createdAt: true, updatedAt: true },
        });
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Patch)(':id/theme'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('theme')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateTheme", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersController);
//# sourceMappingURL=users.controller.js.map