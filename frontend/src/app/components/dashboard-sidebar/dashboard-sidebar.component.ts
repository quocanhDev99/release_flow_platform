import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, Output, signal, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { DeploymentItem, RecordFormModel, ReleaseStream, Repository, Ticket, User } from '../../models/release.model';
import { ReleaseService } from '../../services/release.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'dashboard-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule
  ],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.scss']
})
export class DashboardSidebarComponent implements OnChanges {
  // Services
  private releaseService = inject(ReleaseService);
  private toast = inject(ToastService);

  // Mode Inputs
  @Input() isCreateMode = false;
  @Input() isConfigMode = false;
  @Input() activeItem: DeploymentItem | null = null;
  @Input() activeTicket: Ticket | null = null;
  @Input() preselectedReleaseStreamId?: number;

  // Data Inputs
  @Input() repositories: Repository[] = [];
  @Input() users: User[] = [];
  @Input() releases: ReleaseStream[] = [];
  @Input() environments: any[] = [];
  @Input() sortedReleasesWithIndent: any[] = [];
  @Input() currentUser: User | null = null;

  // Dropdown Options
  @Input() branchBuildOptions: string[] = ['dev', 'dev2', 'devel', 'STG', 'UAT', 'Production'];
  @Input() changeTypes: string[] = ['Feature', 'Fix bug', 'Enhance'];
  @Input() qcStatuses: string[] = ['—', 'Waiting', 'Ready', 'Passed', 'Failed'];
  @Input() statuses: string[] = ['in progress', 'merged'];

  // Event Outputs
  @Output() close = new EventEmitter<void>();
  @Output() refreshData = new EventEmitter<void>();
  @Output() refreshEnvironments = new EventEmitter<void>();

  // State Signals
  readonly isSaving = signal<boolean>(false);

  // Form Models
  formModel: RecordFormModel = this.createDefaultFormModel();

  // Config Mode Inputs & Settings
  newReleaseVersionName = '';
  newRepoName = '';
  newRepoGitUrl = '';
  newEnvironmentName = '';

  settingsForm = {
    TELEGRAM_BOT_TOKEN: '',
    TELEGRAM_CHAT_ID: '',
    TEAMS_WEBHOOK_URL: '',
    SLACK_WEBHOOK_URL: '',
    SMTP_HOST: '',
    SMTP_PORT: '',
    SMTP_USER: '',
    SMTP_PASS: '',
    SMTP_FROM: '',
    SMTP_TO: ''
  };

  // -------------------------------------------------------------------------
  // Lifecycle Hooks
  // -------------------------------------------------------------------------

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isConfigMode) {
      if (changes['isConfigMode']) this.initConfigMode();
      return;
    }

    if (this.isCreateMode) {
      this.initCreateMode();
    } else if (this.activeItem) {
      this.initEditMode();
    }
  }

  // -------------------------------------------------------------------------
  // Form Initialization
  // -------------------------------------------------------------------------

  private createDefaultFormModel(): RecordFormModel {
    return {
      repositoryIds: [],
      userId: null,
      releaseStreamId: undefined,
      sourceBranch: '',
      status: 'in progress',
      branchBuilds: [],
      isMergedOnDevel: false,
      ticketId: '',
      summary: '',
      changeType: 'Feature',
      qcStatus: '—',
      pendingIssues: ''
    };
  }

  initCreateMode(): void {
    this.formModel = {
      ...this.createDefaultFormModel(),
      repositoryIds: this.repositories.length > 0 ? [this.repositories[0].id] : [],
      userId: this.currentUser?.id ?? null,
      releaseStreamId: this.preselectedReleaseStreamId ?? undefined
    };
  }

  initEditMode(): void {
    if (!this.activeItem) return;

    const ticket = this.activeTicket || {
      id: undefined,
      ticketId: '',
      summary: '',
      changeType: 'Feature',
      qcStatus: '—',
      pendingIssues: ''
    };

    const builds = (this.activeItem.builds || [])
      .filter(b => b.status === 'SUCCESS' && b.environment && this.branchBuildOptions.includes(b.environment.name))
      .map(b => b.environment.name);

    this.formModel = {
      repositoryIds: this.activeItem.repositories ? this.activeItem.repositories.map(r => r.id) : [],
      userId: this.activeItem.userId ?? this.currentUser?.id ?? null,
      releaseStreamId: this.activeItem.releaseStreamId,
      sourceBranch: this.activeItem.sourceBranch || '',
      status: this.activeItem.status || 'in progress',
      branchBuilds: builds,
      isMergedOnDevel: !!this.activeItem.isMergedOnDevel,
      ticketId: ticket.ticketId || '',
      summary: ticket.summary || '',
      changeType: (ticket.changeType as any) || 'Feature',
      qcStatus: ticket.qcStatus || '—',
      pendingIssues: ticket.pendingIssues || ''
    };
  }

  initConfigMode(): void {
    this.newReleaseVersionName = '';
    this.newRepoName = '';
    this.newRepoGitUrl = '';
    this.newEnvironmentName = '';
    this.loadSettings();
  }

  closeEditPanel(): void {
    this.close.emit();
  }

  // -------------------------------------------------------------------------
  // Deployment Item Actions (Create / Edit)
  // -------------------------------------------------------------------------

  onBranchChange(branchName: string): void {
    if (!branchName) return;

    const matches = branchName.match(/[a-zA-Z]+[a-zA-Z0-9]*-\d+/g);
    if (matches && matches.length > 0) {
      const uniqueTickets = Array.from(new Set(matches.map(m => m.toUpperCase())));
      this.formModel.ticketId = uniqueTickets.join(', ');
    }
  }

  saveTicketDetails(): void {
    if (!this.validateForm()) return;

    const payload = this.buildPayload();
    this.isSaving.set(true);

    const save$ = this.isCreateMode
      ? this.releaseService.createDeploymentItem(payload)
      : this.releaseService.updateDeploymentItem(this.activeItem!.id, payload);

    save$.subscribe({
      next: () => {
        this.toast.success(this.isCreateMode ? 'Deployment record created successfully.' : 'Record updated successfully.');
        this.refreshData.emit();
        this.closeEditPanel();
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Failed to save deployment record:', err);
        this.toast.error('Failed to save changes. Please try again.');
        this.isSaving.set(false);
      }
    });
  }

  private validateForm(): boolean {
    const userId = this.formModel.userId || this.currentUser?.id;
    const isValid = !!(
      this.formModel.repositoryIds.length &&
      userId &&
      this.formModel.releaseStreamId &&
      this.formModel.ticketId.trim() &&
      this.formModel.sourceBranch.trim()
    );

    if (!isValid) {
      this.toast.warn('Please fill in all required fields: Repository, Developer, Release Stream, Ticket ID, and Branch.');
    }
    return isValid;
  }

  private buildPayload(): any {
    const userId = this.formModel.userId || this.currentUser?.id;
    let branchBuilds = [...this.formModel.branchBuilds];

    if (this.formModel.isMergedOnDevel) {
      if (!branchBuilds.includes('devel')) branchBuilds.push('devel');
    } else {
      branchBuilds = branchBuilds.filter(b => b !== 'devel');
    }

    return {
      repositoryIds: this.formModel.repositoryIds,
      userId,
      releaseStreamId: this.formModel.releaseStreamId,
      sourceBranch: this.formModel.sourceBranch,
      isMergedOnDevel: this.formModel.isMergedOnDevel,
      status: this.formModel.status,
      branchBuilds,
      tickets: [
        {
          id: this.isCreateMode ? undefined : this.activeTicket?.id,
          ticketId: this.formModel.ticketId,
          summary: this.formModel.summary,
          changeType: this.formModel.changeType,
          qcStatus: this.formModel.qcStatus,
          pendingIssues: this.formModel.pendingIssues
        }
      ]
    };
  }

  // -------------------------------------------------------------------------
  // Config Mode Actions (Release Stream / Repo / Env / Settings)
  // -------------------------------------------------------------------------

  addReleaseVersion(): void {
    const version = this.newReleaseVersionName.trim();
    if (!version) return this.toast.warn('Please enter a release version name.');

    this.releaseService.createRelease(version).subscribe({
      next: () => {
        this.toast.success('Release stream added successfully.');
        this.newReleaseVersionName = '';
        this.refreshData.emit();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('An error occurred or this release stream already exists.');
      }
    });
  }

  deleteReleaseStream(rel: any, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm(`Are you sure you want to delete the release stream "${rel.version}"?`)) return;

    this.releaseService.deleteRelease(rel.id).subscribe({
      next: () => {
        this.toast.success(`Release stream "${rel.version}" deleted successfully.`);
        this.refreshData.emit();
      },
      error: (err) => {
        console.error(err);
        this.toast.error(err.error?.message || 'Failed to delete release stream.');
      }
    });
  }

  addRepository(): void {
    const name = this.newRepoName.trim();
    if (!name) return this.toast.warn('Please enter a repository name.');

    this.releaseService.createRepository(name, this.newRepoGitUrl.trim() || undefined).subscribe({
      next: (repo) => {
        this.toast.success(`Repository "${repo.name}" added successfully.`);
        this.newRepoName = '';
        this.newRepoGitUrl = '';
        this.refreshData.emit();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('An error occurred or this repository already exists.');
      }
    });
  }

  deleteRepository(repo: any, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm(`Are you sure you want to delete the repository "${repo.name}"? This will also delete all associated deployment records under it.`)) return;

    this.releaseService.deleteRepository(repo.id).subscribe({
      next: () => {
        this.toast.success(`Repository "${repo.name}" deleted successfully.`);
        this.refreshData.emit();
      },
      error: (err) => {
        console.error(err);
        this.toast.error(err.error?.message || 'Failed to delete repository.');
      }
    });
  }

  addEnvironment(): void {
    const trimmed = this.newEnvironmentName.trim();
    if (!trimmed) return this.toast.warn('Please enter a valid branch build / environment name.');

    this.releaseService.createEnvironment(trimmed, `Môi trường ${trimmed}`).subscribe({
      next: () => {
        this.toast.success(`Branch Build/Environment "${trimmed}" added successfully.`);
        this.newEnvironmentName = '';
        this.refreshEnvironments.emit();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to add branch build.');
      }
    });
  }

  deleteEnvironment(env: any, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm(`Are you sure you want to delete branch build "${env.name}"? Builds associated with this environment will be deleted.`)) return;

    this.releaseService.deleteEnvironment(env.id).subscribe({
      next: () => {
        this.toast.success(`Branch Build "${env.name}" deleted successfully.`);
        this.refreshEnvironments.emit();
      },
      error: (err) => {
        console.error(err);
        this.toast.error(err.error?.message || 'Failed to delete branch build.');
      }
    });
  }

  loadSettings(): void {
    this.releaseService.getSettings().subscribe({
      next: (res) => {
        this.settingsForm = {
          TELEGRAM_BOT_TOKEN: res['TELEGRAM_BOT_TOKEN'] || '',
          TELEGRAM_CHAT_ID: res['TELEGRAM_CHAT_ID'] || '',
          TEAMS_WEBHOOK_URL: res['TEAMS_WEBHOOK_URL'] || '',
          SLACK_WEBHOOK_URL: res['SLACK_WEBHOOK_URL'] || '',
          SMTP_HOST: res['SMTP_HOST'] || '',
          SMTP_PORT: res['SMTP_PORT'] || '',
          SMTP_USER: res['SMTP_USER'] || '',
          SMTP_PASS: res['SMTP_PASS'] || '',
          SMTP_FROM: res['SMTP_FROM'] || '',
          SMTP_TO: res['SMTP_TO'] || ''
        };
      },
      error: (err) => console.error('Failed to load settings:', err)
    });
  }

  saveSettings(): void {
    this.isSaving.set(true);
    this.releaseService.updateSettings(this.settingsForm).subscribe({
      next: () => {
        this.toast.success('System configurations saved successfully.');
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to save configurations.');
        this.isSaving.set(false);
      }
    });
  }

  testNotification(type: 'telegram' | 'email' | 'teams' | 'slack'): void {
    this.toast.info(`Sending test ${type} notification...`);
    this.releaseService.testNotification(type).subscribe({
      next: () => this.toast.success(`Test ${type} notification sent successfully!`),
      error: (err) => {
        console.error(err);
        this.toast.error(err.error?.message || `Failed to send test ${type} notification.`);
      }
    });
  }
}
