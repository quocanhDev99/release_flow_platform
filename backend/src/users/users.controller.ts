import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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
