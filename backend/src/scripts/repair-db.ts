import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting DB Repair and Recovery...');
  const items = await prisma.deploymentItem.findMany({
    include: {
      tickets: true,
      releasePackage: true,
    },
  });

  console.log(`Found ${items.length} deployment items.`);

  for (const item of items) {
    const branch = item.sourceBranch || '';

    // 1. Parse Ticket ID (e.g. MAG-22487 or MAG-22648)
    const ticketMatch = branch.match(/MAG-\d+/i);
    const ticketId = ticketMatch ? ticketMatch[0].toUpperCase() : null;

    // 2. Parse Version (e.g. 1.12.2 or 1.12)
    const versionMatch = branch.match(/\d+(\.\d+)+/);
    const version = versionMatch ? versionMatch[0] : null;

    console.log(
      `Processing Item ID ${item.id} (${branch}): Ticket=${ticketId}, Version=${version}`,
    );

    // Repair Ticket Relation
    if (ticketId && item.tickets.length === 0) {
      // Find or create Ticket
      let ticket = await prisma.ticket.findFirst({
        where: { ticketId },
      });
      if (!ticket) {
        let changeType = 'Feature';
        if (
          branch.toLowerCase().includes('fix') ||
          branch.toLowerCase().includes('bug')
        ) {
          changeType = 'Fix bug';
        } else if (
          branch.toLowerCase().includes('enhance') ||
          branch.toLowerCase().includes('optimize')
        ) {
          changeType = 'Enhance';
        }

        ticket = await prisma.ticket.create({
          data: {
            ticketId,
            summary: `Recovered Ticket for ${branch}`,
            changeType,
            qcStatus: 'Passed',
          },
        });
      }

      // Link Ticket to DeploymentItem
      await prisma.deploymentItem.update({
        where: { id: item.id },
        data: {
          tickets: {
            connect: [{ id: ticket.id }],
          },
        },
      });
      console.log(`  -> Linked Ticket ${ticketId}`);
    }

    // Repair Release Package Relation
    if (version && !item.releasePackageId) {
      // Find or create Release Package
      let pkg = await prisma.releasePackage.findUnique({
        where: { version: `sow/${version}.x` },
      });
      if (!pkg) {
        pkg = await prisma.releasePackage.findUnique({
          where: { version },
        });
      }
      if (!pkg) {
        pkg = await prisma.releasePackage.create({
          data: {
            version: `sow/${version}.x`,
            status: 'active',
          },
        });
      }

      // Link Package to DeploymentItem
      await prisma.deploymentItem.update({
        where: { id: item.id },
        data: {
          releasePackageId: pkg.id,
        },
      });
      console.log(`  -> Linked Release Package ${pkg.version}`);
    }
  }

  console.log('DB Repair completed successfully!');
}

main()
  .catch((e) => console.error('Error repairing DB:', e))
  .finally(() => prisma.$disconnect());
