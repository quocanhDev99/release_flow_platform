import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReleasesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const releases = await this.prisma.releasePackage.findMany();

    // Map unique versions and keep the first ID found
    const versionMap = new Map<string, number>();
    for (const r of releases) {
      const match = r.version.match(/\d+(\.\d+)+/);
      const cleanVer = match ? match[0] : r.version;

      if (!versionMap.has(cleanVer)) {
        versionMap.set(cleanVer, r.id);
      }
    }

    // Convert map to sorted array of objects
    const sortedVersions = Array.from(versionMap.entries()).sort((a, b) => {
      const matchA = a[0].match(/\d+(\.\d+)+/);
      const matchB = b[0].match(/\d+(\.\d+)+/);

      if (!matchA && !matchB) return a[0].localeCompare(b[0]);
      if (!matchA) return 1;
      if (!matchB) return -1;

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

    // Return in the format expected by the frontend: array of { id, version }
    return sortedVersions.map(([version, id]) => ({
      id,
      version,
    }));
  }

  async create(version: string) {
    return this.prisma.releasePackage.create({
      data: { version },
    });
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      // Manually set releasePackageId to null on associated deployment items to prevent FK errors
      await tx.deploymentItem.updateMany({
        where: { releasePackageId: id },
        data: { releasePackageId: null },
      });
      return tx.releasePackage.delete({
        where: { id },
      });
    });
  }
}
