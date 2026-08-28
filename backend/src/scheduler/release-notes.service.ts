import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface ReleaseNoteTicket {
  ticketId: string;
  summary: string;
  changeType: 'Feature' | 'Fix bug' | 'Enhancement' | 'Other';
  developer?: string;
  repositories: string[];
  branch?: string;
  qcStatus?: string;
  jiraUrl: string;
}

export interface ReleaseNotesResponse {
  metadata: {
    windowId: number;
    environment: string;
    startTime: string;
    packageVersion: string;
    status: string;
    releaseManager?: string;
  };
  summary: {
    totalTickets: number;
    featuresCount: number;
    bugfixesCount: number;
    enhancementsCount: number;
    repositories: string[];
  };
  tickets: ReleaseNoteTicket[];
  markdown: string;
  html: string;
}

@Injectable()
export class ReleaseNotesService {
  private readonly logger = new Logger(ReleaseNotesService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async generateReleaseNotes(windowId: number): Promise<ReleaseNotesResponse> {
    const window = await this.prisma.deploymentWindow.findUnique({
      where: { id: windowId },
      include: {
        environment: true,
        bookings: {
          include: {
            releasePackage: {
              include: {
                deploymentItems: {
                  include: {
                    tickets: true,
                    repositories: true,
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!window) {
      throw new NotFoundException(`Deployment window with ID ${windowId} not found`);
    }

    const envName = window.environment?.name || 'Environment';
    const pkg = window.bookings[0]?.releasePackage;
    const pkgVersion = pkg?.version || `Release ${envName}`;
    const startTimeEN = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(window.startTime)) + ' (ICT)';

    // Resolve tickets
    const ticketsMap = new Map<string, ReleaseNoteTicket>();
    const repositoriesSet = new Set<string>();

    // 1. Direct relations from releasePackage
    if (pkg?.deploymentItems) {
      for (const item of pkg.deploymentItems) {
        const repoNames = item.repositories.map((r) => r.name);
        repoNames.forEach((r) => repositoriesSet.add(r));

        for (const t of item.tickets) {
          const changeType = this.normalizeChangeType(t.changeType);
          ticketsMap.set(t.ticketId, {
            ticketId: t.ticketId,
            summary: t.summary || 'No description provided',
            changeType,
            developer: item.user?.username || 'Team',
            repositories: repoNames.length > 0 ? repoNames : ['Main'],
            branch: item.sourceBranch,
            qcStatus: t.qcStatus || 'Passed',
            jiraUrl: `https://jira.intranet/browse/${t.ticketId}`,
          });
        }
      }
    }

    // 2. Fallback to SOW version matching if no direct items attached
    if (ticketsMap.size === 0) {
      const match = pkgVersion.match(/(\d+\.\d+(?:\.\d+)?)/);
      if (match) {
        const fixVerNumber = match[1];
        const matchedItems = await this.prisma.deploymentItem.findMany({
          where: {
            OR: [
              { releasePackage: { version: { contains: fixVerNumber } } },
              { sourceBranch: { contains: fixVerNumber } },
            ],
          },
          include: {
            tickets: true,
            repositories: true,
            user: true,
          },
        });

        for (const item of matchedItems) {
          const repoNames = item.repositories.map((r) => r.name);
          repoNames.forEach((r) => repositoriesSet.add(r));
          for (const t of item.tickets) {
            if (!ticketsMap.has(t.ticketId)) {
              ticketsMap.set(t.ticketId, {
                ticketId: t.ticketId,
                summary: t.summary || 'Task implementation',
                changeType: this.normalizeChangeType(t.changeType),
                developer: item.user?.username || 'Developer',
                repositories: repoNames.length > 0 ? repoNames : ['Core'],
                branch: item.sourceBranch,
                qcStatus: t.qcStatus || 'Passed',
                jiraUrl: `https://jira.intranet/browse/${t.ticketId}`,
              });
            }
          }
        }
      }
    }

    const tickets = Array.from(ticketsMap.values());
    const repositories = Array.from(repositoriesSet);

    const features = tickets.filter((t) => t.changeType === 'Feature');
    const bugfixes = tickets.filter((t) => t.changeType === 'Fix bug');
    const enhancements = tickets.filter((t) => t.changeType === 'Enhancement');

    const markdown = this.buildMarkdown({
      pkgVersion,
      envName,
      startTimeEN,
      status: window.status,
      repositories,
      features,
      bugfixes,
      enhancements,
      allTickets: tickets,
    });

    const html = this.buildHtml({
      pkgVersion,
      envName,
      startTimeEN,
      status: window.status,
      repositories,
      features,
      bugfixes,
      enhancements,
      allTickets: tickets,
    });

    return {
      metadata: {
        windowId: window.id,
        environment: envName,
        startTime: startTimeEN,
        packageVersion: pkgVersion,
        status: window.status,
        releaseManager: 'Release Management Team',
      },
      summary: {
        totalTickets: tickets.length,
        featuresCount: features.length,
        bugfixesCount: bugfixes.length,
        enhancementsCount: enhancements.length,
        repositories: repositories.length > 0 ? repositories : ['Core', 'CMS', 'Promotion'],
      },
      tickets,
      markdown,
      html,
    };
  }

  async broadcastReleaseNotes(
    windowId: number,
    options: {
      channels?: string[];
      customNote?: string;
    },
  ) {
    const data = await this.generateReleaseNotes(windowId);
    const channels = options.channels || ['telegram', 'teams', 'slack', 'email'];

    const message = `🚀 <b>[RELEASE HANDOVER REPORT] — ${data.metadata.packageVersion}</b>\n\n` +
      `📅 <b>Time:</b> ${data.metadata.startTime}\n` +
      `🎯 <b>Environment:</b> ${data.metadata.environment}\n` +
      `📦 <b>Repositories:</b> ${data.summary.repositories.join(', ')}\n` +
      `📊 <b>Summary:</b> ${data.summary.totalTickets} tickets (${data.summary.featuresCount} Features, ${data.summary.bugfixesCount} Bugs)\n\n` +
      (options.customNote ? `💬 <b>Note:</b> ${options.customNote}\n\n` : '') +
      `🔗 <b>Key Tickets:</b>\n` +
      data.tickets.slice(0, 10).map((t) => `• <a href="${t.jiraUrl}">${t.ticketId}</a> - ${t.summary}`).join('\n');

    const results = await Promise.allSettled(
      channels.map(async (channel) => {
        if (channel === 'telegram') {
          return this.notificationsService.sendTelegramNotification(message);
        } else if (channel === 'teams') {
          return this.notificationsService.sendTeamsNotification(
            `🚀 Release Handover: ${data.metadata.packageVersion}`,
            data.markdown,
          );
        } else if (channel === 'slack') {
          return this.notificationsService.sendSlackNotification(data.markdown);
        } else if (channel === 'email') {
          return this.notificationsService.sendEmailNotification(
            `[Release Handover] ${data.metadata.packageVersion} (${data.metadata.environment})`,
            data.html,
          );
        }
      }),
    );

    return {
      success: true,
      broadcastedAt: new Date().toISOString(),
      channels,
      results,
    };
  }

  private normalizeChangeType(type?: string): 'Feature' | 'Fix bug' | 'Enhancement' | 'Other' {
    if (!type) return 'Feature';
    const lower = type.toLowerCase();
    if (lower.includes('fix') || lower.includes('bug')) return 'Fix bug';
    if (lower.includes('enhance') || lower.includes('improve')) return 'Enhancement';
    if (lower.includes('feat')) return 'Feature';
    return 'Feature';
  }

  private buildMarkdown(data: {
    pkgVersion: string;
    envName: string;
    startTimeEN: string;
    status: string;
    repositories: string[];
    features: ReleaseNoteTicket[];
    bugfixes: ReleaseNoteTicket[];
    enhancements: ReleaseNoteTicket[];
    allTickets: ReleaseNoteTicket[];
  }): string {
    const lines: string[] = [];

    lines.push(`# 🚀 Release Handover Notes: ${data.pkgVersion}`);
    lines.push(`> **Environment:** \`${data.envName}\` | **Deploy Time:** \`${data.startTimeEN}\` | **Status:** \`${data.status.toUpperCase()}\``);
    lines.push('');

    lines.push('### 📦 Affected Repositories');
    if (data.repositories.length > 0) {
      lines.push(data.repositories.map((r) => `- **${r}**`).join('\n'));
    } else {
      lines.push('- **Core Platform**\n- **CMS**\n- **Promotion**');
    }
    lines.push('');

    if (data.features.length > 0) {
      lines.push('### ✨ Key Features & Deliverables');
      for (const f of data.features) {
        lines.push(`- **[${f.ticketId}](${f.jiraUrl})** — ${f.summary} _(@${f.developer || 'team'})_`);
      }
      lines.push('');
    }

    if (data.bugfixes.length > 0) {
      lines.push('### 🐞 Bug Fixes & Hotfixes');
      for (const b of data.bugfixes) {
        lines.push(`- **[${b.ticketId}](${b.jiraUrl})** — ${b.summary} _(@${b.developer || 'team'})_`);
      }
      lines.push('');
    }

    if (data.enhancements.length > 0) {
      lines.push('### ⚡ Enhancements & Improvements');
      for (const e of data.enhancements) {
        lines.push(`- **[${e.ticketId}](${e.jiraUrl})** — ${e.summary} _(@${e.developer || 'team'})_`);
      }
      lines.push('');
    }

    if (data.allTickets.length === 0) {
      lines.push('### 📋 Deployment Scope');
      lines.push(`- Core system synchronization and deployment for **${data.pkgVersion}**.`);
      lines.push('');
    }

    lines.push('### 👥 Verification & QA Sign-off');
    lines.push('- **QA Status:** Ready for Sanity & Smoke Testing');
    lines.push('- **Rollback Plan:** Standard Git Tag Revert Protocol');
    lines.push('');
    lines.push('---');
    lines.push(`_Generated automatically by Release Flow Platform on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}_`);

    return lines.join('\n');
  }

  private buildHtml(data: {
    pkgVersion: string;
    envName: string;
    startTimeEN: string;
    status: string;
    repositories: string[];
    features: ReleaseNoteTicket[];
    bugfixes: ReleaseNoteTicket[];
    enhancements: ReleaseNoteTicket[];
    allTickets: ReleaseNoteTicket[];
  }): string {
    const reposList = data.repositories.length > 0 ? data.repositories.join(', ') : 'Core, CMS, Promotion';

    const renderTicketRow = (t: ReleaseNoteTicket, badgeColor: string) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 700;">
          <a href="${t.jiraUrl}" style="color: #4f46e5; text-decoration: none;">${t.ticketId}</a>
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">
          <span style="background: ${badgeColor}; color: #ffffff; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${t.changeType}</span>
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 13px;">${t.summary}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px; font-weight: 500;">${t.developer || 'Team'}</td>
      </tr>
    `;

    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: #ffffff; padding: 20px 24px;">
        <h2 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 800; letter-spacing: -0.2px;">🚀 Release Handover: ${data.pkgVersion}</h2>
        <p style="margin: 0; font-size: 12.5px; opacity: 0.9;"><strong>Environment:</strong> ${data.envName} &nbsp;|&nbsp; <strong>Deploy Time:</strong> ${data.startTimeEN}</p>
      </div>

      <div style="padding: 18px 22px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 18px;">
          <p style="margin: 0; font-size: 12.5px; color: #334155;">
            <strong>📦 Repositories:</strong> ${reposList} &nbsp;|&nbsp; 
            <strong>📊 Total Tickets:</strong> ${data.allTickets.length} &nbsp;|&nbsp; 
            <strong>Status:</strong> <span style="color: #16a34a; font-weight: 700;">${data.status.toUpperCase()}</span>
          </p>
        </div>

        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 14px 0 10px 0; border-bottom: 2px solid #4f46e5; padding-bottom: 4px;">
          📋 Ticket Scope & Deliverables
        </h3>

        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 18px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left; color: #475569; font-size: 11.5px; text-transform: uppercase;">
              <th style="padding: 8px 12px; border-bottom: 1px solid #cbd5e1;">Ticket Key</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #cbd5e1;">Type</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #cbd5e1;">Summary / Scope</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #cbd5e1;">Assignee</th>
            </tr>
          </thead>
          <tbody>
            ${data.allTickets.map((t) => renderTicketRow(t, t.changeType === 'Feature' ? '#2563eb' : t.changeType === 'Fix bug' ? '#dc2626' : '#059669')).join('')}
            ${data.allTickets.length === 0 ? '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #64748b;">All deployment packages configured for this release.</td></tr>' : ''}
          </tbody>
        </table>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #166534;">
          <strong>✅ QA & Verification:</strong> Ready for QA team to execute Sanity & Smoke Testing on <strong>${data.envName}</strong> environment.
        </div>
      </div>

      <div style="background: #f8fafc; padding: 10px 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
        Generated automatically by <strong>Release Flow Platform</strong>
      </div>
    </div>
    `;
  }
}
