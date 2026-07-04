import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.user.findMany({
      orderBy: { username: 'asc' },
      select: { id: true, username: true, email: true, theme: true, createdAt: true, updatedAt: true },
    });
  }

  @Post('register')
  async register(@Body() body: { username: string; email: string; password: string }) {
    const { username, email, password } = body;

    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { username, email, password: hashedPassword },
      select: { id: true, username: true, email: true, theme: true, createdAt: true, updatedAt: true },
    });
    return user;
  }

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const { username, password } = body;

    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Return user without password
    const { password: _pwd, ...safeUser } = user;
    return safeUser;
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    // Search for a matching user email
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });

    // For security, don't disclose if user was found or not
    if (!user) {
      return { message: 'If the email exists, a reset link will be logged.' };
    }

    // Generate token and expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: expires
      }
    });

    // Simulate sending email by logging the reset link to console
    console.log('\n==================================================');
    console.log(`[RESET PASSWORD] Link for user: ${user.username} (${user.email})`);
    console.log(`Link: http://localhost:4200/reset-password?token=${token}`);
    console.log('==================================================\n');

    return { message: 'Reset token generated successfully' };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password?: string }) {
    const { token, password } = body;
    if (!token || !password) {
      throw new BadRequestException('Token and password are required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gte: new Date() }
      }
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
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

  @Patch(':id/theme')
  updateTheme(
    @Param('id', ParseIntPipe) id: number,
    @Body('theme') theme: string,
  ) {
    return this.prisma.user.update({
      where: { id },
      data: { theme },
      select: { id: true, username: true, email: true, theme: true, createdAt: true, updatedAt: true },
    });
  }
}
