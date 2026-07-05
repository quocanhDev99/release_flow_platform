import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReleaseService } from '../../services/release.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '../toast/toast.component';
import { DeploymentItem, ReleaseStream, Ticket, Repository, User } from '../../models/release.model';
import * as XLSX from 'xlsx';

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
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTooltipModule,
    ToastComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private releaseService = inject(ReleaseService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  // States
  isLoading = signal<boolean>(false);
  deploymentItems = signal<DeploymentItem[]>([]);
  filteredItems = signal<DeploymentItem[]>([]);
  releases = signal<ReleaseStream[]>([]);
  repositories = signal<Repository[]>([]);
  users = signal<User[]>([]);
  currentUser = signal<User | null>(this.authService.getCurrentUser());

  // Grouping state & helpers
  isGrouped = signal<boolean>(true);

  toggleGrouping() {
    this.isGrouped.update(val => !val);
  }

  /** Returns the raw numeric version key from a deployment item (e.g. "1.12.1"). */
  getVersionKey(item: DeploymentItem): string {
    const versionStr = item.releaseStream?.version || item.sourceBranch || '';
    const match = versionStr.match(/\d+(\.\d+)*/);
    return match ? match[0] : 'unclassified';
  }

  /**
   * Builds a flat list with hierarchical group headers.
   * Each group header carries a `level` property:
   *   level 1 → 1.x   (2-segment version, e.g. 1.12)
   *   level 2 → 1.x.x (3-segment, e.g. 1.12.1)
   *   level 3 → 1.x.x.x (4-segment, e.g. 1.12.1.2)
   */
  groupedDataSource = computed(() => {
    if (!this.isGrouped()) {
      return this.filteredItems();
    }

    const items = this.filteredItems();

    // Bucket items by their exact version key
    const buckets = new Map<string, { parts: number[]; items: DeploymentItem[] }>();
    for (const item of items) {
      const key = this.getVersionKey(item);
      const parts = key === 'unclassified' ? [] : key.split('.').map(Number);
      if (!buckets.has(key)) {
        buckets.set(key, { parts, items: [] });
      }
      buckets.get(key)!.items.push(item);
    }

    // Sort keys: unclassified last, others numerically by version parts
    const sortedKeys = [...buckets.keys()].sort((a, b) => {
      if (a === 'unclassified') return 1;
      if (b === 'unclassified') return -1;
      const pa = buckets.get(a)!.parts;
      const pb = buckets.get(b)!.parts;
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (diff !== 0) return diff;
      }
      return 0;
    });

    const result: any[] = [];
    for (const key of sortedKeys) {
      const { parts, items: groupItems } = buckets.get(key)!;
      // Level: 2 parts → 1 (1.x), 3 parts → 2 (1.x.x), 4+ parts → 3 (1.x.x.x)
      const level = key === 'unclassified' ? 1 : Math.min(3, Math.max(1, parts.length - 1));
      result.push({
        isHeader: true,
        groupName: key === 'unclassified' ? 'Unclassified' : key,
        level,
        count: groupItems.length
      });
      result.push(...groupItems);
    }
    return result;
  });

  groupedHierarchicalData = computed(() => {
    const items = this.filteredItems();
    const rootNodes: any[] = [];
    const level1Map = new Map<string, any>();

    for (const item of items) {
      const key = this.getVersionKey(item);
      if (key === 'unclassified') {
        let unclassNode = rootNodes.find(n => n.versionKey === 'Unclassified');
        if (!unclassNode) {
          unclassNode = { versionKey: 'Unclassified', level: 1, directItems: [], subNodes: [], totalCount: 0 };
          rootNodes.push(unclassNode);
        }
        unclassNode.directItems.push(item);
        continue;
      }

      const parts = key.split('.').map(Number);
      const l1Key = parts.slice(0, 2).join('.');

      let l1Node = level1Map.get(l1Key);
      if (!l1Node) {
        l1Node = { versionKey: l1Key, level: 1, directItems: [], subNodes: [], totalCount: 0 };
        level1Map.set(l1Key, l1Node);
      }

      if (parts.length <= 2) {
        l1Node.directItems.push(item);
      } else {
        const l2Key = parts.slice(0, 3).join('.');
        let l2Node = l1Node.subNodes.find((n: any) => n.versionKey === l2Key);
        if (!l2Node) {
          l2Node = { versionKey: l2Key, level: 2, directItems: [], subNodes: [], totalCount: 0 };
          l1Node.subNodes.push(l2Node);
        }

        if (parts.length === 3) {
          l2Node.directItems.push(item);
        } else {
          const l3Key = parts.slice(0, 4).join('.');
          let l3Node = l2Node.subNodes.find((n: any) => n.versionKey === l3Key);
          if (!l3Node) {
            l3Node = { versionKey: l3Key, level: 3, directItems: [], subNodes: [], totalCount: 0 };
            l2Node.subNodes.push(l3Node);
          }
          l3Node.directItems.push(item);
        }
      }
    }

    const list = Array.from(level1Map.values());
    list.sort((a, b) => {
      const pa = a.versionKey.split('.').map(Number);
      const pb = b.versionKey.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (diff !== 0) return diff;
      }
      return 0;
    });

    for (const l1 of list) {
      l1.subNodes.sort((a: any, b: any) => {
        const pa = a.versionKey.split('.').map(Number);
        const pb = b.versionKey.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
          const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
          if (diff !== 0) return diff;
        }
        return 0;
      });

      for (const l2 of l1.subNodes) {
        l2.subNodes.sort((a: any, b: any) => {
          const pa = a.versionKey.split('.').map(Number);
          const pb = b.versionKey.split('.').map(Number);
          for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
            if (diff !== 0) return diff;
          }
          return 0;
        });
      }
    }

    const calcCounts = (node: any): number => {
      let count = node.directItems.length;
      for (const sub of node.subNodes) {
        count += calcCounts(sub);
      }
      node.totalCount = count;
      return count;
    };

    for (const node of list) {
      calcCounts(node);
    }

    const unclass = rootNodes.find(n => n.versionKey === 'Unclassified');
    if (unclass) {
      calcCounts(unclass);
      list.push(unclass);
    }

    return list;
  });

  isGroupHeaderRow = (index: number, item: any): boolean => {
    return item && item.isHeader === true;
  };

  releasesGrouped = computed(() => {
    const list = this.releases();
    const groupsMap = new Map<string, typeof list>();

    for (const rel of list) {
      const versionStr = rel.version.replace(/x$/, '');
      const match = versionStr.match(/(\d+)\.(\d+)/);
      const groupName = match ? `${match[1]}.${match[2]}` : 'Others';

      if (!groupsMap.has(groupName)) {
        groupsMap.set(groupName, []);
      }
      groupsMap.get(groupName)!.push(rel);
    }

    return Array.from(groupsMap.entries()).map(([name, items]) => {
      const sortedItems = items.sort((a, b) => {
        const matchA = a.version.replace(/x$/, '').match(/\d+(\.\d+)+/);
        const matchB = b.version.replace(/x$/, '').match(/\d+(\.\d+)+/);
        if (!matchA || !matchB) return a.version.localeCompare(b.version);

        const partsA = matchA[0].split('.').map(Number);
        const partsB = matchB[0].split('.').map(Number);
        const maxLen = Math.max(partsA.length, partsB.length);
        for (let i = 0; i < maxLen; i++) {
          const valA = partsA[i] !== undefined ? partsA[i] : 0;
          const valB = partsB[i] !== undefined ? partsB[i] : 0;
          if (valA !== valB) return valA - valB;
        }
        return 0;
      });

      return {
        name,
        items: sortedItems
      };
    }).sort((a, b) => {
      if (a.name === 'Others') return 1;
      if (b.name === 'Others') return -1;

      const matchA = a.name.match(/(\d+)\.(\d+)/);
      const matchB = b.name.match(/(\d+)\.(\d+)/);
      if (!matchA || !matchB) return a.name.localeCompare(b.name);

      const majorA = Number(matchA[1]);
      const minorA = Number(matchA[2]);
      const majorB = Number(matchB[1]);
      const minorB = Number(matchB[2]);

      if (majorA !== majorB) return majorA - majorB;
      return minorA - minorB;
    });
  });

  sortedReleasesWithIndent = computed(() => {
    const list = [...this.releases()].sort((a, b) => {
      const matchA = a.version.match(/\d+(\.\d+)+/);
      const matchB = b.version.match(/\d+(\.\d+)+/);
      if (!matchA || !matchB) return a.version.localeCompare(b.version);

      const partsA = matchA[0].split('.').map(Number);
      const partsB = matchB[0].split('.').map(Number);
      const maxLen = Math.max(partsA.length, partsB.length);
      for (let i = 0; i < maxLen; i++) {
        const valA = partsA[i] !== undefined ? partsA[i] : 0;
        const valB = partsB[i] !== undefined ? partsB[i] : 0;
        if (valA !== valB) return valA - valB;
      }
      return 0;
    });

    return list.map(rel => {
      const match = rel.version.match(/\d+(\.\d+)*/);
      const key = match ? match[0] : rel.version;
      const parts = key.split('.').map(Number);
      // Depth level: 2 parts (e.g., 1.12) -> 0, 3 parts (e.g., 1.12.1) -> 1, 4 parts -> 2, etc.
      const depth = Math.max(0, parts.length - 2);
      const indentArray = Array(depth).fill(0);
      return {
        version: rel.version,
        displayName: key,
        depth,
        indentArray
      };
    });
  });

  // Search & Filter state
  searchText = '';
  selectedRepo = '';
  selectedRelease = '';
  selectedQCStatus = '';
  selectedStatus = '';
  selectedBranchBuild = '';

  // Pagination state
  totalItems = signal<number>(0);
  pageIndex = signal<number>(0);
  pageSize = signal<number>(10);

  // Sort state
  readonly SORT_MODES: Array<{ sortBy: string; sortOrder: 'asc' | 'desc'; label: string; icon: string }> = [
    { sortBy: 'createdAt', sortOrder: 'desc', label: 'Created Date', icon: 'arrow_downward' },
    { sortBy: 'createdAt', sortOrder: 'asc', label: 'Created Date', icon: 'arrow_upward' },
    { sortBy: 'releaseVersion', sortOrder: 'asc', label: 'Release Version', icon: 'arrow_upward' },
    { sortBy: 'releaseVersion', sortOrder: 'desc', label: 'Release Version', icon: 'arrow_downward' },
  ];
  sortModeIndex = signal<number>(0);
  get currentSort() { return this.SORT_MODES[this.sortModeIndex()]; }

  toggleSort() {
    this.sortModeIndex.update(i => (i + 1) % this.SORT_MODES.length);
    this.pageIndex.set(0);
    this.loadData();
  }

  // Create Mode state
  isCreateMode = false;
  isConfigMode = false;
  newReleaseVersionName = '';
  newReleaseVersion = '';
  newRepoName = '';
  newRepoGitUrl = '';
  newRepoId: number | null = null;
  newUserId: number | null = null;
  newReleaseStreamId: number | null = null;
  newSourceBranch = '';
  newTicketId = '';
  newSummary = '';
  newChangeType: 'Feature' | 'Fix bug' | 'Enhance' = 'Feature';
  newQCStatus = 'waiting for QC test';
  newPendingIssues = '';
  newIsMergedOnDevel = false;
  newStatus = 'merged';

  // New Branch Build selections
  newBranchBuilds: string[] = [];
  activeBranchBuilds: string[] = [];
  branchBuildOptions = ['dev', 'dev2', 'devel', 'STG', 'UAT', 'Production'];

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
    'developer',
    'createdAt',
    'updatedAt',
    'actions'
  ];

  // QC Status dropdown options
  qcStatuses: string[] = [
    '—',
    'Waiting',
    'Ready',
    'Passed',
    'Failed'
  ];

  // Change type options
  changeTypes: string[] = ['Feature', 'Fix bug', 'Enhance'];

  // Status options
  statuses: string[] = ['in progress', 'merged'];

  // Detail item for editing side-panel
  activeItem: DeploymentItem | null = null;
  activeTicket: Ticket | null = null;

  applyTheme(theme: string) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  toggleTheme() {
    const user = this.currentUser();
    if (!user) return;
    const newTheme = user.theme === 'dark' ? 'light' : 'dark';

    // Update local state
    const updated = { ...user, theme: newTheme };
    this.currentUser.set(updated);
    this.applyTheme(newTheme);

    // Save to DB and update localStorage via AuthService
    this.authService.updateTheme(newTheme).subscribe({
      next: () => this.toast.success(`Theme switched to ${newTheme} mode.`),
      error: (err) => console.error('Failed to save theme in DB', err)
    });
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser.set(user);
      this.applyTheme(user.theme || 'light');
    }
    this.loadData();
  }

  loadData() {
    const params: any = {
      page: this.pageIndex() + 1,
      pageSize: this.pageSize()
    };
    if (this.searchText.trim()) {
      params.search = this.searchText.trim();
    }
    if (this.selectedRepo) {
      params.repoName = this.selectedRepo;
    }
    if (this.selectedRelease) {
      params.releaseVersion = this.selectedRelease;
    }
    if (this.selectedQCStatus) {
      params.qcStatus = this.selectedQCStatus;
    }
    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }
    if (this.selectedBranchBuild) {
      params.branchBuild = this.selectedBranchBuild;
    }
    params.sortBy = this.currentSort.sortBy;
    params.sortOrder = this.currentSort.sortOrder;

    this.isLoading.set(true);
    this.releaseService.getDeploymentItems(params).subscribe({
      next: (res) => {
        this.deploymentItems.set(res.data);
        this.totalItems.set(res.total);
        this.filteredItems.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load deployment items', err);
        this.isLoading.set(false);
      }
    });

    this.releaseService.getReleases().subscribe({
      next: (rel) => this.releases.set(rel),
      error: (err) => console.error('Failed to load releases', err)
    });

    this.releaseService.getRepositories().subscribe({
      next: (repos) => this.repositories.set(repos),
      error: (err) => console.error('Failed to load repositories', err)
    });

    this.releaseService.getUsers().subscribe({
      next: (usr) => this.users.set(usr),
      error: (err) => console.error('Failed to load users', err)
    });
  }

  applyFilters() {
    this.pageIndex.set(0);
    this.loadData();
  }

  onPageChange(event: any) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadData();
  }

  // Handle inline change event: Checkbox "Merge on Devel"
  onMergeDevelChange(item: DeploymentItem, checked: boolean) {
    item.isMergedOnDevel = checked;
    this.releaseService.patchMergeDevel(item.id, checked).subscribe({
      next: () => {
        console.log(`Updated merge-devel for item ${item.id}`);
        this.loadData();
      },
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

  deleteItem(item: DeploymentItem) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Delete Record',
        message: 'This will permanently remove this deployment record and all associated tickets. This action cannot be undone.',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        type: 'danger'
      }
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.isLoading.set(true);
      this.releaseService.deleteDeploymentItem(item.id).subscribe({
        next: () => {
          this.toast.success('Record deleted successfully.');
          this.loadData();
        },
        error: (err) => {
          console.error('Failed to delete deployment item', err);
          this.toast.error('Failed to delete the record. Please try again.');
          this.isLoading.set(false);
        }
      });
    });
  }

  // open panel to edit ticket detail (Pending Issues, builds)
  openEditPanel(item: DeploymentItem, ticket: Ticket) {
    this.isCreateMode = false;
    this.activeItem = { ...item };
    this.activeTicket = { ...ticket };
    this.activeBranchBuilds = item.builds
      ? item.builds
        .filter(b => b.status === 'SUCCESS' && b.environment && this.branchBuildOptions.includes(b.environment.name))
        .map(b => b.environment.name)
      : [];
  }

  openCreatePanel() {
    this.isCreateMode = true;
    this.newRepoId = this.repositories().length > 0 ? this.repositories()[0].id : null;
    // Auto-fill userId from logged-in account
    this.newUserId = this.currentUser()?.id ?? null;
    this.newReleaseVersion = '';
    this.newSourceBranch = '';
    this.newTicketId = '';
    this.newSummary = '';
    this.newChangeType = 'Feature';
    this.newQCStatus = '—';
    this.newPendingIssues = '';
    this.newIsMergedOnDevel = false;
    this.newStatus = 'merged';
    this.newBranchBuilds = [];

    // Use dummy items to open the panel
    this.activeItem = {} as any;
    this.activeTicket = {} as any;
  }

  closeEditPanel() {
    this.activeItem = null;
    this.activeTicket = null;
    this.isCreateMode = false;
    this.isConfigMode = false;
  }

  openConfigPanel() {
    this.isConfigMode = true;
    this.newReleaseVersionName = '';
    this.newRepoName = '';
    this.newRepoGitUrl = '';
    // Use dummy activeItem to open sidebar
    this.activeItem = {} as any;
  }

  addReleaseVersion() {
    if (!this.newReleaseVersionName.trim()) {
      this.toast.warn('Please enter a release version name.');
      return;
    }

    this.releaseService.createRelease(this.newReleaseVersionName.trim()).subscribe({
      next: () => {
        this.toast.success('Release stream added successfully.');
        this.newReleaseVersionName = '';
        this.loadData();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('An error occurred or this release stream already exists.');
      }
    });
  }

  openCreatePanelWithVersion(versionKey: string, event: MouseEvent) {
    event.stopPropagation();
    this.openCreatePanel();

    // Find the original release version in the DB list that matches this clean key
    const match = this.releases().find(r => this.cleanVersion(r.version) === versionKey);
    if (match) {
      this.newReleaseVersion = match.version;
    }
  }

  addRepository() {
    if (!this.newRepoName.trim()) {
      this.toast.warn('Please enter a repository name.');
      return;
    }

    this.releaseService.createRepository(this.newRepoName.trim(), this.newRepoGitUrl.trim() || undefined).subscribe({
      next: (repo) => {
        this.toast.success(`Repository ${repo.name} added successfully.`);
        this.newRepoName = '';
        this.newRepoGitUrl = '';
        this.loadData();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('An error occurred or this repository already exists.');
      }
    });
  }

  deleteReleaseStream(rel: any, event: MouseEvent) {
    event.stopPropagation();
    const confirmed = confirm(`Are you sure you want to delete the release stream "${rel.version}"?`);
    if (!confirmed) return;

    this.releaseService.deleteRelease(rel.id).subscribe({
      next: () => {
        this.toast.success(`Release stream "${rel.version}" deleted successfully.`);
        this.loadData();
      },
      error: (err) => {
        console.error(err);
        this.toast.error(err.error?.message || 'Failed to delete release stream.');
      }
    });
  }

  deleteRepository(repo: any, event: MouseEvent) {
    event.stopPropagation();
    const confirmed = confirm(`Are you sure you want to delete the repository "${repo.name}"? This will also delete all associated deployment records under it.`);
    if (!confirmed) return;

    this.releaseService.deleteRepository(repo.id).subscribe({
      next: () => {
        this.toast.success(`Repository "${repo.name}" deleted successfully.`);
        this.loadData();
      },
      error: (err) => {
        console.error(err);
        this.toast.error(err.error?.message || 'Failed to delete repository.');
      }
    });
  }

  // Save details from panel
  saveTicketDetails() {
    if (this.isCreateMode) {
      // Validate: use logged-in user ID, not dropdown
      const userId = this.currentUser()?.id;
      if (!this.newRepoId || !userId || !this.newTicketId.trim() || !this.newSourceBranch.trim()) {
        this.toast.warn('Please fill in all required fields: Repository, Ticket ID, and Branch.');
        return;
      }

      let branchBuilds = [...this.newBranchBuilds];
      if (this.newIsMergedOnDevel) {
        if (!branchBuilds.includes('devel')) {
          branchBuilds.push('devel');
        }
      } else {
        branchBuilds = branchBuilds.filter(b => b !== 'devel');
      }

      const payload = {
        repositoryId: this.newRepoId,
        userId: userId,
        releaseVersion: this.newReleaseVersion,
        sourceBranch: this.newSourceBranch,
        isMergedOnDevel: this.newIsMergedOnDevel,
        status: this.newStatus,
        branchBuilds,
        tickets: [
          {
            ticketId: this.newTicketId,
            summary: this.newSummary,
            changeType: this.newChangeType,
            qcStatus: this.newQCStatus,
            pendingIssues: this.newPendingIssues
          }
        ]
      };

      this.releaseService.createDeploymentItem(payload).subscribe({
        next: () => {
          this.toast.success('Deployment record created successfully.');
          this.loadData();
          this.closeEditPanel();
        },
        error: (err) => {
          console.error('Failed to create deployment item', err);
          this.toast.error('Failed to create the record. Please try again.');
        }
      });
    } else {
      if (!this.activeItem || !this.activeTicket) return;

      let branchBuilds = [...this.activeBranchBuilds];
      if (this.activeItem.isMergedOnDevel) {
        if (!branchBuilds.includes('devel')) {
          branchBuilds.push('devel');
        }
      } else {
        branchBuilds = branchBuilds.filter(b => b !== 'devel');
      }

      const payload = {
        sourceBranch: this.activeItem.sourceBranch,
        isMergedOnDevel: this.activeItem.isMergedOnDevel,
        releaseStreamId: this.activeItem.releaseStreamId,
        status: this.activeItem.status,
        userId: this.activeItem.userId,
        branchBuilds,
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
          this.toast.success('Record updated successfully.');
          this.loadData();
          this.closeEditPanel();
        },
        error: (err) => {
          console.error('Failed to save details', err);
          this.toast.error('Failed to save changes. Please try again.');
        }
      });
    }
  }

  // Excel / CSV Upload parsing
  onExcelUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bstr = e.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length <= 1) {
          this.toast.warn('The Excel/CSV file contains no data rows (header only).');
          return;
        }

        const headers = data[0].map(h => String(h).toLowerCase().trim());
        const getColIndex = (names: string[]) => headers.findIndex(h => names.some(n => h.includes(n)));

        const idxRepo = getColIndex(['repo', 'kho nguồn']);
        const idxTicket = getColIndex(['ticket', 'mã ticket']);
        const idxSummary = getColIndex(['summary', 'tóm tắt', 'mô tả']);
        const idxType = getColIndex(['type', 'phân loại', 'loại']);
        const idxRelease = getColIndex(['release', 'fix version', 'bản release', 'phiên bản']);
        const idxBranch = getColIndex(['branch', 'nhánh', 'nhánh phát triển']);
        const idxMergeDevel = getColIndex(['merge on devel', 'devel', 'merge devel']);
        const idxQC = getColIndex(['ready for qc', 'qc status', 'trạng thái qc', 'qc']);
        const idxPending = getColIndex(['pending issues', 'tồn đọng', 'lỗi']);
        const idxUser = getColIndex(['user', 'developer', 'người merge', 'tài khoản']);
        const idxBranchBuild = getColIndex(['branch build', 'build']);

        if (idxTicket === -1) {
          this.toast.error('Column "Ticket ID" or "Ticket" was not found in the uploaded file.');
          return;
        }

        const items: any[] = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0 || !row[idxTicket]) continue;

          const ticketId = String(row[idxTicket]).trim();
          if (!ticketId) continue;

          const repoName = idxRepo !== -1 && row[idxRepo] ? String(row[idxRepo]).trim() : 'Core';
          const summary = idxSummary !== -1 && row[idxSummary] ? String(row[idxSummary]).trim() : '';
          const changeType = idxType !== -1 && row[idxType] ? String(row[idxType]).trim() : 'Feature';
          const releaseVersion = idxRelease !== -1 && row[idxRelease] ? String(row[idxRelease]).trim() : '';
          const sourceBranch = idxBranch !== -1 && row[idxBranch] ? String(row[idxBranch]).trim() : 'main';
          const mergeDevelVal = idxMergeDevel !== -1 && row[idxMergeDevel] ? String(row[idxMergeDevel]).trim().toLowerCase() : '';
          const isMergedOnDevel = ['yes', 'true', 'x', '1', 'đã merge', 'có'].includes(mergeDevelVal);
          const qcStatus = idxQC !== -1 && row[idxQC] ? String(row[idxQC]).trim() : 'waiting for QC test';
          const pendingIssues = idxPending !== -1 && row[idxPending] ? String(row[idxPending]).trim() : '';
          const username = idxUser !== -1 && row[idxUser] ? String(row[idxUser]).trim() : 'system';

          // Parse Branch Build UAT/Production column
          const branchBuildsVal = idxBranchBuild !== -1 && row[idxBranchBuild] ? String(row[idxBranchBuild]).trim() : '';
          const rawBuilds = branchBuildsVal ? branchBuildsVal.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];
          const branchBuilds: string[] = [];

          for (const rb of rawBuilds) {
            if (rb.includes('devel')) {
              if (!branchBuilds.includes('devel')) branchBuilds.push('devel');
            } else if (rb.includes('dev2') || rb.includes('dev-2')) {
              if (!branchBuilds.includes('dev2')) branchBuilds.push('dev2');
            } else if (rb.includes('dev')) {
              if (!branchBuilds.includes('dev')) branchBuilds.push('dev');
            } else if (rb.includes('prod') || rb.includes('production')) {
              if (!branchBuilds.includes('Production')) branchBuilds.push('Production');
            } else if (rb.includes('stg') || rb.includes('staging')) {
              if (!branchBuilds.includes('STG')) branchBuilds.push('STG');
            } else if (rb.includes('uat')) {
              if (!branchBuilds.includes('UAT')) branchBuilds.push('UAT');
            } else {
              if (!branchBuilds.includes(rb)) branchBuilds.push(rb);
            }
          }

          if (isMergedOnDevel && !branchBuilds.includes('devel')) {
            branchBuilds.push('devel');
          }

          items.push({ repoName, ticketId, summary, changeType, releaseVersion, sourceBranch, isMergedOnDevel, qcStatus, pendingIssues, username, branchBuilds });
        }

        if (items.length === 0) {
          this.toast.warn('No valid data rows were found in the uploaded file.');
          return;
        }

        this.releaseService.bulkCreateDeploymentItems(items).subscribe({
          next: (res) => {
            this.toast.success(`Successfully imported ${res.length} record(s) from the file.`);
            this.loadData();
          },
          error: (err) => {
            console.error(err);
            this.toast.error('An error occurred while uploading data to the server.');
          }
        });
      } catch (err) {
        console.error(err);
        this.toast.error('Invalid file format or an error occurred reading the file.');
      }
    };
    reader.readAsBinaryString(file);
    input.value = '';
  }

  // Helper method to display build environments as a string
  getBuildsString(item: DeploymentItem): string {
    if (!item.builds || item.builds.length === 0) return '-';
    return item.builds
      .filter(b => b.status === 'SUCCESS')
      .map(b => b.environment.name)
      .join(', ');
  }

  // ─── Badge class helpers (BEM modifiers) ────────────────────────────────
  getChangeTypeClass(type: string): string {
    switch (type) {
      case 'Feature': return 'row-badge--feature';
      case 'Fix bug': return 'row-badge--bug';
      case 'Enhance': return 'row-badge--enhance';
      default: return 'row-badge--default-repo';
    }
  }

  getRepoBadgeClass(name: string): string {
    const n = (name || '').toLowerCase();
    if (n === 'core') return 'row-badge--core';
    if (n === 'e-com') return 'row-badge--ecom';
    if (n === 'cms') return 'row-badge--cms';
    if (n === 'e-marketing') return 'row-badge--emarketing';
    if (n === 'promotion') return 'row-badge--promotion';
    return 'row-badge--default-repo';
  }

  getStatusBadgeClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'merged': return 'row-badge--merged';
      case 'pending': return 'row-badge--pending';
      case 'closed': return 'row-badge--closed';
      default: return 'row-badge--closed';
    }
  }

  getQCStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'ready': return 'qc-select--ready';
      case 'passed': return 'qc-select--passed';
      case 'failed': return 'qc-select--failed';
      default: return 'qc-select--waiting';
    }
  }

  /** Format an ISO date string as compact DD/MM/YY HH:mm */
  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(2);
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
  }

  cleanVersion(version?: string): string {
    if (!version) return '—';
    const match = version.match(/\d+(\.\d+)*/);
    return match ? match[0] : version;
  }
}

