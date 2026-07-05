import { PrismaService } from '../prisma/prisma.service';
export declare class UsersController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        email: string;
        theme: string;
    }[]>;
    register(body: {
        username: string;
        email: string;
        password: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        email: string;
        theme: string;
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        email: string;
        theme: string;
        resetToken: string | null;
        resetTokenExpires: Date | null;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(body: {
        token: string;
        password?: string;
    }): Promise<{
        message: string;
    }>;
    updateTheme(id: number, theme: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        email: string;
        theme: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    updateProfile(id: number, body: {
        username?: string;
        email?: string;
        password?: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        email: string;
        theme: string;
    }>;
}
