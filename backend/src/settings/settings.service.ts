import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAllSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  }

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key }
    });
    return setting?.value || null;
  }

  async bulkUpdateSettings(data: Record<string, string>) {
    const operations = Object.entries(data).map(([key, value]) => {
      return this.prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    });
    await this.prisma.$transaction(operations);
    return this.getAllSettings();
  }
}
