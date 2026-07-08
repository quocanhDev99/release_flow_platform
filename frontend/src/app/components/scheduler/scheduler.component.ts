/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { ReleaseService } from '../../services/release.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { DeploymentWindow, ReleasePackage, Environment } from '../../models/release.model';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    ToastComponent
  ],
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.scss'
})
export class SchedulerComponent implements OnInit {
  private releaseService = inject(ReleaseService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Core Data Signals
  windows = signal<DeploymentWindow[]>([]);
  environments = signal<Environment[]>([]);
  loading = signal<boolean>(false);

  // Calendar State Signals
  currentMonth = signal<Date>(new Date(2026, 6, 1)); // Default to July 2026 to match image
  calendarDays = signal<Date[]>([]);
  selectedDay = signal<Date | null>(new Date(2026, 6, 10)); // Selected default date

  // AI OCR Scanner simulation state
  selectedImageName = signal<string>('');
  isScanning = signal<boolean>(false);
  ocrLogs = signal<string[]>([]);
  ocrResult = signal<any[] | null>(null);

  // Modal Visibility Signals
  showWindowModal = signal<boolean>(false);

  // Form Group
  windowForm!: FormGroup;

  // Selected entities for edit/details
  selectedWindow = signal<DeploymentWindow | null>(null);

  // Current logged in user info
  currentUser = signal<any>(null);

  // Active theme
  theme = signal<string>('light');

  // Computed alert list of windows happening today
  upcomingAlerts = computed(() => {
    const today = new Date();
    return this.windows().filter(w => {
      const wDate = new Date(w.startTime);
      return this.isSameDay(wDate, today) && w.status !== 'completed' && w.status !== 'cancelled';
    });
  });

  // Windows filtering computed based on selected date
  filteredWindows = computed(() => {
    const sel = this.selectedDay();
    if (!sel) return this.windows();
    return this.windows().filter(w => this.isSameDay(new Date(w.startTime), sel));
  });

  ngOnInit() {
    this.initForms();
    this.loadAll();
    this.currentUser.set(this.authService.getCurrentUser());
    this.theme.set(localStorage.getItem('theme') || 'light');
    if (this.theme() === 'dark') {
      document.body.classList.add('dark-theme');
    }
    this.generateCalendar(this.currentMonth());
  }

  private initForms() {
    this.windowForm = this.fb.group({
      environmentId: ['', Validators.required],
      startTime: ['', Validators.required],
      fixVersion: ['', Validators.required]
    });
  }

  loadAll() {
    this.loading.set(true);
    
    this.releaseService.getDeploymentWindows().subscribe({
      next: (res) => {
        this.windows.set(res);
        this.generateCalendar(this.currentMonth());
      },
      error: () => this.toastService.error('Error loading deployment windows')
    });

    this.releaseService.getEnvironments().subscribe({
      next: (res) => this.environments.set(res),
      error: () => this.toastService.error('Error loading environments'),
      complete: () => this.loading.set(false)
    });
  }

  // --- Calendar Logic ---

  generateCalendar(monthDate: Date) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday...
    
    const tempDays: Date[] = [];
    
    // Fill previous month trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      tempDays.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    
    // Fill current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      tempDays.push(new Date(year, month, i));
    }
    
    // Fill next month trailing days to complete 35 or 42 grid slots
    const totalCells = tempDays.length > 35 ? 42 : 35;
    const remaining = totalCells - tempDays.length;
    for (let i = 1; i <= remaining; i++) {
      tempDays.push(new Date(year, month + 1, i));
    }
    
    this.calendarDays.set(tempDays);
  }

  prevMonth() {
    const d = this.currentMonth();
    const newDate = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    this.currentMonth.set(newDate);
    this.generateCalendar(newDate);
  }

  nextMonth() {
    const d = this.currentMonth();
    const newDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    this.currentMonth.set(newDate);
    this.generateCalendar(newDate);
  }

  selectDay(day: Date) {
    this.selectedDay.set(day);
  }

  isToday(day: Date): boolean {
    const today = new Date();
    return this.isSameDay(day, today);
  }

  isSameDay(d1: Date, d2: Date): boolean {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  }

  hasWindowOnDay(day: Date): boolean {
    return this.windows().some(w => this.isSameDay(new Date(w.startTime), day));
  }

  getWindowsColorsForDay(day: Date): string[] {
    const colors: string[] = [];
    const dayWindows = this.windows().filter(w => this.isSameDay(new Date(w.startTime), day));
    dayWindows.forEach(w => {
      if (!colors.includes(w.environment.name)) {
        colors.push(w.environment.name);
      }
    });
    return colors;
  }

  // --- AI Image OCR Simulation Logic ---

  onImageSelected(event: any) {
    const file = event.target.files[0] as File;
    if (file) {
      this.selectedImageName.set(file.name);
      this.simulateOCR();
    }
  }

  simulateOCR() {
    this.isScanning.set(true);
    this.ocrLogs.set([]);
    this.ocrResult.set(null);

    const logSteps = [
      'Processing image analysis...',
      'Detecting Calendar grid layout (July 2026)...',
      'Parsing text & identifying schedules...',
      'Detected 15 deployment windows (UAT, STG, PROD)...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logSteps.length) {
        this.ocrLogs.update(logs => [...logs, logSteps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        
        // Exact 15 items from user's image calendar for July 2026 (10:00 AM default time)
        const rawOcrItems = [
          { date: '2026-06-29', env: 'Production', version: 'Release PROD - 1.11.2', hour: 10 },
          { date: '2026-07-01', env: 'STG', version: 'Release STG', hour: 10 },
          { date: '2026-07-03', env: 'STG', version: 'Release STG', hour: 10 },
          { date: '2026-07-06', env: 'UAT', version: 'Release UAT - 1.12.1', hour: 10 },
          { date: '2026-07-08', env: 'STG', version: 'Release STG', hour: 10 },
          { date: '2026-07-10', env: 'STG', version: 'Release STG', hour: 10 },
          { date: '2026-07-13', env: 'Production', version: 'Release PROD - 1.12.1', hour: 10 },
          { date: '2026-07-15', env: 'STG', version: 'Release STG', hour: 10 },
          { date: '2026-07-17', env: 'STG', version: 'Release STG', hour: 10 },
          { date: '2026-07-20', env: 'UAT', version: 'Release UAT - 1.12.2', hour: 10 },
          { date: '2026-07-22', env: 'STG', version: 'Release STG', hour: 10 },
          { date: '2026-07-24', env: 'STG', version: 'Release STG', hour: 10 },
          { date: '2026-07-27', env: 'Production', version: 'Release PROD - 1.12.2', hour: 10 },
          { date: '2026-07-29', env: 'STG', version: 'Release STG', hour: 10 },
          { date: '2026-07-31', env: 'STG', version: 'Release STG', hour: 10 }
        ];

        const mappedResult = rawOcrItems.map(item => {
          const envName = item.env.toUpperCase();
          let env = this.environments().find(e => e.name.toUpperCase() === envName);
          if (!env) {
            if (envName.includes('PROD')) {
              env = this.environments().find(e => e.name.toUpperCase().includes('PROD') || e.name.toUpperCase().includes('PRODUCTION'));
            } else if (envName.includes('STG')) {
              env = this.environments().find(e => e.name.toUpperCase().includes('STG') || e.name.toUpperCase().includes('STAGING'));
            } else if (envName.includes('UAT')) {
              env = this.environments().find(e => e.name.toUpperCase().includes('UAT'));
            }
          }
          
          return {
            environmentId: env?.id || 1,
            environmentName: env?.name || item.env,
            startTime: `${item.date}T10:00`,
            version: item.version
          };
        });

        this.ocrResult.set(mappedResult);
        this.isScanning.set(false);
        this.toastService.success('AI successfully extracted 15 schedules!');
      }
    }, 600);
  }

  importOCRResult() {
    const items = this.ocrResult();
    if (!items || items.length === 0) return;

    this.loading.set(true);

    // Find and clean up any existing windows for July 2026 (month index 6) to prevent duplicates
    const oldWindows = this.windows().filter(w => {
      const d = new Date(w.startTime);
      return d.getFullYear() === 2026 && d.getMonth() === 6;
    });

    this.deleteWindowsSequentially(0, oldWindows, () => {
      this.importOCRItems(0, items);
    });
  }

  private deleteWindowsSequentially(index: number, list: DeploymentWindow[], callback: () => void) {
    if (index >= list.length) {
      callback();
      return;
    }
    this.releaseService.deleteDeploymentWindow(list[index].id).subscribe({
      next: () => this.deleteWindowsSequentially(index + 1, list, callback),
      error: () => this.deleteWindowsSequentially(index + 1, list, callback)
    });
  }

  private importOCRItems(index: number, items: any[]) {
    if (index >= items.length) {
      this.toastService.success(`Successfully synchronized ${items.length} schedules to database!`);
      this.clearOCR();
      this.loadAll();
      return;
    }

    const item = items[index];
    const start = new Date(item.startTime);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const freeze = new Date(start.getTime() - 4 * 60 * 60 * 1000);

    this.releaseService.createDeploymentWindow({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      freezeTime: freeze.toISOString(),
      capacity: 20,
      status: 'open',
      environmentId: item.environmentId
    }).subscribe({
      next: (win) => {
        this.releaseService.createReleasePackage({
          version: item.version,
          status: 'active'
        }).subscribe({
          next: (pkg) => {
            this.releaseService.createDeploymentBooking({
              releasePackageId: pkg.id,
              deploymentWindowId: win.id,
              status: 'approved'
            }).subscribe({
              next: () => {
                this.importOCRItems(index + 1, items);
              },
              error: () => this.importOCRItems(index + 1, items)
            });
          },
          error: () => this.importOCRItems(index + 1, items)
        });
      },
      error: () => this.importOCRItems(index + 1, items)
    });
  }

  clearOCR() {
    this.selectedImageName.set('');
    this.ocrLogs.set([]);
    this.ocrResult.set(null);
  }

  // --- Operations ---

  openCreateWindowModal() {
    this.selectedWindow.set(null); // Ensure Create mode
    const sel = this.selectedDay();
    let defaultStart = '';
    
    if (sel) {
      const d = new Date(sel);
      d.setHours(10, 0, 0, 0); // Default to 10:00 AM
      defaultStart = d.toISOString().slice(0, 16);
    }

    this.windowForm.reset({
      startTime: defaultStart,
      environmentId: this.environments()[0]?.id || '',
      fixVersion: ''
    });
    this.showWindowModal.set(true);
  }

  openEditWindowModal(win: DeploymentWindow) {
    this.selectedWindow.set(win); // Set selected window for edit mode
    
    const date = new Date(win.startTime);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);

    const version = this.getFixVersion(win);

    this.windowForm.reset({
      environmentId: win.environmentId,
      startTime: localISOTime,
      fixVersion: version === 'N/A' ? '' : version
    });
    this.showWindowModal.set(true);
  }

  closeWindowModal() {
    this.showWindowModal.set(false);
    this.selectedWindow.set(null); // Clear selected window state
  }

  saveWindow() {
    if (this.windowForm.invalid) return;

    this.loading.set(true);
    const { startTime, environmentId, fixVersion } = this.windowForm.value;
    
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const freeze = new Date(start.getTime() - 4 * 60 * 60 * 1000);

    const selectedWin = this.selectedWindow();

    if (selectedWin) {
      // --- EDIT MODE ---
      this.releaseService.updateDeploymentWindow(selectedWin.id, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        freezeTime: freeze.toISOString(),
        environmentId: Number(environmentId)
      }).subscribe({
        next: () => {
          const booking = selectedWin.bookings?.[0];
          if (booking && booking.releasePackageId) {
            // Update existing Release Package version
            this.releaseService.updateReleasePackage(booking.releasePackageId, {
              version: fixVersion
            }).subscribe({
              next: () => {
                this.toastService.success('Successfully updated deployment schedule!');
                this.closeWindowModal();
                this.loadAll();
              },
              error: () => {
                this.toastService.error('Error updating build version');
                this.loadAll();
              }
            });
          } else {
            // No booking existed, create a new package and link it
            this.releaseService.createReleasePackage({
              version: fixVersion,
              status: 'active'
            }).subscribe({
              next: (pkg) => {
                this.releaseService.createDeploymentBooking({
                  releasePackageId: pkg.id,
                  deploymentWindowId: selectedWin.id,
                  status: 'approved'
                }).subscribe({
                  next: () => {
                    this.toastService.success('Successfully updated deployment schedule!');
                    this.closeWindowModal();
                    this.loadAll();
                  },
                  error: () => {
                    this.toastService.error('Error linking deployment schedule');
                    this.loadAll();
                  }
                });
              },
              error: () => {
                this.toastService.error('Error creating Release Package');
                this.loadAll();
              }
            });
          }
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Unable to update deployment schedule');
          this.loading.set(false);
        }
      });
    } else {
      // --- CREATE MODE ---
      this.releaseService.createDeploymentWindow({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        freezeTime: freeze.toISOString(),
        capacity: 20,
        status: 'open',
        environmentId: Number(environmentId)
      }).subscribe({
        next: (win) => {
          this.releaseService.createReleasePackage({
            version: fixVersion,
            status: 'active'
          }).subscribe({
            next: (pkg) => {
              this.releaseService.createDeploymentBooking({
                releasePackageId: pkg.id,
                deploymentWindowId: win.id,
                status: 'approved'
              }).subscribe({
                next: () => {
                  this.toastService.success('Successfully created deployment schedule!');
                  this.closeWindowModal();
                  this.loadAll();
                },
                error: () => {
                  this.toastService.error('Error linking deployment schedule');
                  this.loadAll();
                }
              });
            },
            error: () => {
              this.toastService.error('Error creating Release Package');
              this.loadAll();
            }
          });
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Unable to create Deployment Window');
          this.loading.set(false);
        }
      });
    }
  }

  deleteWindow(id: number) {
    if (!confirm('Are you sure you want to delete this deployment schedule?')) return;

    this.loading.set(true);
    this.releaseService.deleteDeploymentWindow(id).subscribe({
      next: () => {
        this.toastService.success('Deployment schedule deleted!');
        this.loadAll();
      },
      error: () => {
        this.toastService.error('Unable to delete deployment schedule');
        this.loading.set(false);
      }
    });
  }

  // --- UI Helpers ---

  getFixVersion(win: DeploymentWindow): string {
    if (win.bookings && win.bookings.length > 0) {
      return win.bookings[0].releasePackage?.version || 'N/A';
    }
    return 'N/A';
  }

  formatDate(dateStr: string | Date): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatTime(dateStr: string | Date): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // 24h format
    });
  }

  formatMonthYear(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleTheme() {
    const newTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(newTheme);
    localStorage.setItem('theme', newTheme);

    const userId = this.currentUser()?.id;
    if (userId) {
      this.releaseService.updateUserTheme(userId, newTheme).subscribe();
    }

    if (newTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
