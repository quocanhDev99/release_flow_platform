import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DeploymentItem, ReleaseStream, Repository } from '../../models/release.model';

export interface CommandAction {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  category: 'Actions' | 'Tickets' | 'Releases' | 'Repositories';
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss']
})
export class CommandPaletteComponent {
  @Input() isOpen = false;
  @Input() deploymentItems: DeploymentItem[] = [];
  @Input() repositories: Repository[] = [];
  @Input() releases: ReleaseStream[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() createRecord = new EventEmitter<void>();
  @Output() filterQCStatus = new EventEmitter<string>();
  @Output() navigateToScheduler = new EventEmitter<void>();
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() selectTicket = new EventEmitter<DeploymentItem>();

  readonly searchQuery = signal<string>('');
  readonly selectedIndex = signal<number>(0);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.searchQuery.set('');
        this.selectedIndex.set(0);
      }
    } else if (event.key === 'Escape' && this.isOpen) {
      this.closePalette();
    } else if (this.isOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.navigate(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.navigate(-1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this.executeSelected();
      }
    }
  }

  readonly actions = computed<CommandAction[]>(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list: CommandAction[] = [];

    // Quick Actions
    const defaultActions: CommandAction[] = [
      {
        id: 'new-record',
        icon: 'add_circle',
        title: 'Create New Record',
        subtitle: 'Add a new deployment record and ticket',
        category: 'Actions',
        action: () => this.createRecord.emit()
      },
      {
        id: 'filter-failed',
        icon: 'warning',
        title: 'Filter: Failed QC Tickets',
        subtitle: 'Show only items requiring immediate QC attention',
        category: 'Actions',
        action: () => this.filterQCStatus.emit('Failed')
      },
      {
        id: 'filter-ready',
        icon: 'check_circle',
        title: 'Filter: QC Ready Tickets',
        subtitle: 'Show items ready for testing',
        category: 'Actions',
        action: () => this.filterQCStatus.emit('Ready')
      },
      {
        id: 'scheduler',
        icon: 'calendar_month',
        title: 'Open Deployment Scheduler',
        subtitle: 'View upcoming deployment dates calendar',
        category: 'Actions',
        action: () => this.navigateToScheduler.emit()
      },
      {
        id: 'toggle-theme',
        icon: 'dark_mode',
        title: 'Toggle Light / Dark Mode',
        subtitle: 'Switch application color theme',
        category: 'Actions',
        action: () => this.toggleTheme.emit()
      }
    ];

    // Filter Quick Actions
    defaultActions.forEach(act => {
      if (!q || act.title.toLowerCase().includes(q) || (act.subtitle && act.subtitle.toLowerCase().includes(q))) {
        list.push(act);
      }
    });

    // Tickets
    if (this.deploymentItems) {
      this.deploymentItems.forEach(item => {
        if (item.tickets) {
          item.tickets.forEach(t => {
            const ticketId = t.ticketId || '';
            const summary = t.summary || item.sourceBranch || '';
            if (!q || ticketId.toLowerCase().includes(q) || summary.toLowerCase().includes(q)) {
              list.push({
                id: `ticket-${item.id}-${t.id}`,
                icon: 'confirmation_number',
                title: ticketId,
                subtitle: `${summary.replace(/<[^>]*>?/gm, '').substring(0, 60)}... (${item.repository?.name || 'Repo'})`,
                category: 'Tickets',
                action: () => this.selectTicket.emit(item)
              });
            }
          });
        }
      });
    }

    return list.slice(0, 15); // Limit max search results
  });

  navigate(direction: number) {
    const total = this.actions().length;
    if (total === 0) return;
    let next = this.selectedIndex() + direction;
    if (next < 0) next = total - 1;
    if (next >= total) next = 0;
    this.selectedIndex.set(next);
  }

  executeSelected() {
    const current = this.actions()[this.selectedIndex()];
    if (current) {
      current.action();
      this.closePalette();
    }
  }

  executeAction(act: CommandAction) {
    act.action();
    this.closePalette();
  }

  closePalette() {
    this.isOpen = false;
    this.close.emit();
  }
}
