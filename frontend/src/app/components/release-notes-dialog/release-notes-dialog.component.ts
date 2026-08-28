import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ReleaseService } from '../../services/release.service';
import { ToastService } from '../../services/toast.service';

export interface ReleaseNotesDialogData {
  windowId: number;
  environmentName?: string;
  packageVersion?: string;
}

@Component({
  selector: 'app-release-notes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './release-notes-dialog.component.html',
  styleUrl: './release-notes-dialog.component.scss',
})
export class ReleaseNotesDialogComponent implements OnInit {
  private releaseService = inject(ReleaseService);
  private toastService = inject(ToastService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  releaseData = signal<any | null>(null);

  copiedType = signal<'markdown' | 'html' | null>(null);
  isBroadcasting = signal<boolean>(false);
  broadcastSuccess = signal<boolean>(false);
  customBroadcastNote = signal<string>('');

  selectedChannels = signal<{ telegram: boolean; teams: boolean; slack: boolean; email: boolean }>({
    telegram: true,
    teams: true,
    slack: true,
    email: true,
  });

  constructor(
    public dialogRef: MatDialogRef<ReleaseNotesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReleaseNotesDialogData,
  ) {}

  ngOnInit() {
    this.fetchReleaseNotes();
  }

  fetchReleaseNotes() {
    this.loading.set(true);
    this.error.set(null);

    this.releaseService.getReleaseNotes(this.data.windowId).subscribe({
      next: (res) => {
        this.releaseData.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load release notes');
        this.loading.set(false);
      },
    });
  }

  async copyMarkdown() {
    const md = this.releaseData()?.markdown;
    if (!md) return;

    try {
      await navigator.clipboard.writeText(md);
      this.copiedType.set('markdown');
      this.toastService.success('Copied Markdown release notes to clipboard!');
      setTimeout(() => this.copiedType.set(null), 2500);
    } catch {
      this.toastService.error('Failed to copy Markdown to clipboard');
    }
  }

  async copyHtmlForEmail() {
    const html = this.releaseData()?.html;
    if (!html) return;

    try {
      if (typeof ClipboardItem !== 'undefined') {
        const type = 'text/html';
        const blob = new Blob([html], { type });
        const data = [new ClipboardItem({ [type]: blob })];
        await navigator.clipboard.write(data);
      } else {
        await navigator.clipboard.writeText(html);
      }

      this.copiedType.set('html');
      this.toastService.success('Copied Rich HTML for Outlook / Gmail!');
      setTimeout(() => this.copiedType.set(null), 2500);
    } catch {
      // Fallback
      await navigator.clipboard.writeText(html);
      this.copiedType.set('html');
      this.toastService.success('Copied HTML text to clipboard!');
      setTimeout(() => this.copiedType.set(null), 2500);
    }
  }

  downloadMarkdown() {
    const md = this.releaseData()?.markdown;
    if (!md) return;

    const version = this.releaseData()?.metadata?.packageVersion || 'Release';
    const filename = `Release_Notes_${version.replace(/\s+/g, '_')}.md`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.toastService.success(`Downloaded ${filename}`);
  }

  toggleChannel(channel: 'telegram' | 'teams' | 'slack' | 'email') {
    this.selectedChannels.update((prev) => ({
      ...prev,
      [channel]: !prev[channel],
    }));
  }

  broadcastReport() {
    const activeChannels = Object.entries(this.selectedChannels())
      .filter(([_, active]) => active)
      .map(([channel]) => channel);

    if (activeChannels.length === 0) {
      this.toastService.warn('Please select at least one notification channel');
      return;
    }

    this.isBroadcasting.set(true);

    this.releaseService
      .broadcastReleaseNotes(this.data.windowId, {
        channels: activeChannels,
        customNote: this.customBroadcastNote().trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.isBroadcasting.set(false);
          this.broadcastSuccess.set(true);
          this.toastService.success(`Broadcasted release notes to: ${activeChannels.join(', ')}`);
          setTimeout(() => this.broadcastSuccess.set(false), 3500);
        },
        error: (err) => {
          this.isBroadcasting.set(false);
          this.toastService.error(`Failed to broadcast: ${err.error?.message || 'Network error'}`);
        },
      });
  }

  close() {
    this.dialogRef.close();
  }
}
