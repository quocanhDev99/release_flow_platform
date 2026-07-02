import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { ReleaseService } from '../../services/release.service';
import { DeploymentItem, ReleaseStream, Ticket } from '../../models/release.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatChipsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private releaseService = inject(ReleaseService);
  private dialog = inject(MatDialog);

  // States
  deploymentItems = signal<DeploymentItem[]>([]);
  filteredItems = signal<DeploymentItem[]>([]);
  releases = signal<ReleaseStream[]>([]);

  // Search & Filter state
  searchText = '';
  selectedRepo = '';
  selectedRelease = '';
  selectedQCStatus = '';

  // Table configuration
  displayedColumns: string[] = [
    'repo',
    'ticket',
    'fixVersion',
    'sourceBranch',
    'status',
    'branchBuilds',
    'isMergedOnDevel',
    'changeType',
    'qcStatus',
    'pendingIssues',
    'actions'
  ];

  // QC Status dropdown options
  qcStatuses: string[] = [
    'waiting for QC test',
    'ready for QC',
    'passed',
    'failed'
  ];

  // Change type options
  changeTypes: string[] = ['Feature', 'Fix bug', 'Enhance'];

  // Detail item for editing side-panel
  activeItem: DeploymentItem | null = null;
  activeTicket: Ticket | null = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.releaseService.getDeploymentItems().subscribe({
      next: (items) => {
        this.deploymentItems.set(items);
        this.applyFilters();
      },
      error: (err) => console.error('Failed to load deployment items', err)
    });

    this.releaseService.getReleases().subscribe({
      next: (rel) => this.releases.set(rel),
      error: (err) => console.error('Failed to load releases', err)
    });
  }

  applyFilters() {
    let result = this.deploymentItems();

    // 1. Search text (Ticket ID or Branch name)
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase().trim();
      result = result.filter(item =>
        item.tickets.some(t => t.ticketId.toLowerCase().includes(search)) ||
        item.sourceBranch.toLowerCase().includes(search)
      );
    }

    // 2. Filter by Repo
    if (this.selectedRepo) {
      result = result.filter(item => item.repository.name === this.selectedRepo);
    }

    // 3. Filter by Release version
    if (this.selectedRelease) {
      result = result.filter(item => item.releaseStream?.version === this.selectedRelease);
    }

    // 4. Filter by QC Status
    if (this.selectedQCStatus) {
      result = result.filter(item =>
        item.tickets.some(t => t.qcStatus === this.selectedQCStatus)
      );
    }

    this.filteredItems.set(result);
  }

  // Handle inline change event: Checkbox "Merge on Devel"
  onMergeDevelChange(item: DeploymentItem, checked: boolean) {
    item.isMergedOnDevel = checked;
    this.releaseService.patchMergeDevel(item.id, checked).subscribe({
      next: () => console.log(`Updated merge-devel for item ${item.id}`),
      error: (err) => {
        console.error(err);
        item.isMergedOnDevel = !checked; // revert UI on failure
      }
    });
  }

  // Handle inline change event: QC Status
  onQCStatusChange(ticket: Ticket, status: string) {
    ticket.qcStatus = status;
    this.releaseService.patchQCStatus(ticket.id, status).subscribe({
      next: () => console.log(`Updated QC status for ticket ${ticket.ticketId}`),
      error: (err) => console.error(err)
    });
  }

  // open panel to edit ticket detail (Pending Issues, builds)
  openEditPanel(item: DeploymentItem, ticket: Ticket) {
    this.activeItem = { ...item };
    this.activeTicket = { ...ticket };
  }

  closeEditPanel() {
    this.activeItem = null;
    this.activeTicket = null;
  }

  // Save details from panel
  saveTicketDetails() {
    if (!this.activeItem || !this.activeTicket) return;

    const payload = {
      sourceBranch: this.activeItem.sourceBranch,
      isMergedOnDevel: this.activeItem.isMergedOnDevel,
      releaseStreamId: this.activeItem.releaseStreamId,
      tickets: [
        {
          id: this.activeTicket.id,
          changeType: this.activeTicket.changeType,
          qcStatus: this.activeTicket.qcStatus,
          pendingIssues: this.activeTicket.pendingIssues
        }
      ]
    };

    this.releaseService.updateDeploymentItem(this.activeItem.id, payload).subscribe({
      next: () => {
        this.loadData();
        this.closeEditPanel();
      },
      error: (err) => console.error('Failed to save details', err)
    });
  }

  // Helper method to display build environments as a string
  getBuildsString(item: DeploymentItem): string {
    if (!item.builds || item.builds.length === 0) return '-';
    return item.builds
      .filter(b => b.status === 'SUCCESS')
      .map(b => b.environment.name)
      .join(', ');
  }

  // Helper method to get badge color classes
  getChangeTypeClass(type: string): string {
    switch (type) {
      case 'Feature': return 'badge-feature';
      case 'Fix bug': return 'badge-bug';
      case 'Enhance': return 'badge-enhance';
      default: return 'badge-default';
    }
  }

  getQCStatusClass(status: string): string {
    switch (status) {
      case 'ready for QC': return 'qc-ready';
      case 'passed': return 'qc-passed';
      case 'failed': return 'qc-failed';
      default: return 'qc-waiting';
    }
  }
}
