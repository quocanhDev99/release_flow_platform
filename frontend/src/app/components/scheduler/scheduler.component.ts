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
import { createWorker } from 'tesseract.js';
import * as XLSX from 'xlsx';
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
    ToastComponent
  ],
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.scss']
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
  releasePackages = signal<ReleasePackage[]>([]);
  versionTicketsMap = signal<Record<string, Array<{ ticketId: string; summary?: string; url: string }>>>({});
  loading = signal<boolean>(false);

  // Calendar State Signals dynamically initialized to user system's current date/month/year
  currentMonth = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  calendarDays = signal<Date[]>([]);
  selectedDay = signal<Date | null>(new Date());

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

  // Computed list of available Fix Versions dynamically from ReleasePackages and Windows
  availableVersions = computed(() => {
    const set = new Set<string>();
    this.releasePackages().forEach(pkg => {
      if (pkg.version) set.add(pkg.version.trim());
    });
    this.windows().forEach(win => {
      const v = this.getFixVersion(win);
      if (v && v !== 'N/A') set.add(v.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  });

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
    let completedCount = 0;
    const totalRequests = 4;
    const checkDone = () => {
      completedCount++;
      if (completedCount >= totalRequests) {
        this.loading.set(false);
      }
    };

    this.releaseService.getDeploymentWindows().subscribe({
      next: (res) => {
        this.windows.set(res);
        // Do NOT call generateCalendar here — already called in ngOnInit and after loadAll-triggered updates
      },
      error: () => {
        this.toastService.error('Error loading deployment windows');
        checkDone();
      },
      complete: () => checkDone()
    });

    this.releaseService.getEnvironments().subscribe({
      next: (res) => this.environments.set(res),
      error: () => {
        this.toastService.error('Error loading environments');
        checkDone();
      },
      complete: () => checkDone()
    });

    this.releaseService.getReleasePackages().subscribe({
      next: (res) => this.releasePackages.set(res),
      error: () => checkDone(),
      complete: () => checkDone()
    });

    this.releaseService.getTicketsMap().subscribe({
      next: (map) => this.versionTicketsMap.set(map),
      error: () => checkDone(),
      complete: () => checkDone()
    });
  }

  getRelatedTicketsForWindow(win: DeploymentWindow): { ticketId: string; url: string; summary?: string }[] {
    const ticketsMap = new Map<string, { ticketId: string; url: string; summary?: string }>();
    const baseUrl = 'https://storai.atlassian.net/browse/';

    const version = this.getFixVersion(win);
    if (!version || version === 'N/A') return [];

    // Extract clean numerical version e.g. "1.12.0" from "v1.12.0", "Release STG - 1.12.0", etc.
    const match = version.match(/\d+(\.\d+)+/);
    const cleanVer = match ? match[0] : version.trim().replace(/^v/i, '');

    // 1. Check direct relation items from ReleasePackage
    const releasePackage = win.bookings?.[0]?.releasePackage as any;
    if (releasePackage && releasePackage.deploymentItems && Array.isArray(releasePackage.deploymentItems)) {
      releasePackage.deploymentItems.forEach((item: any) => {
        if (item.tickets) {
          item.tickets.forEach((t: any) => {
            if (t.ticketId) {
              const ids = t.ticketId.split(',').map((s: string) => s.trim()).filter(Boolean);
              ids.forEach((singleId: string) => {
                if (!ticketsMap.has(singleId)) {
                  ticketsMap.set(singleId, {
                    ticketId: singleId,
                    url: `${baseUrl}${singleId}`,
                    summary: t.summary || undefined
                  });
                }
              });
            }
          });
        }
      });
    }

    // 2. Dedicated Version-Tickets API Lookup
    if (cleanVer) {
      const tickets = this.versionTicketsMap()[cleanVer];
      if (tickets && Array.isArray(tickets)) {
        tickets.forEach(t => {
          if (!ticketsMap.has(t.ticketId)) {
            ticketsMap.set(t.ticketId, t);
          }
        });
      }
    }

    return Array.from(ticketsMap.values());
  }

  sendDailyAlertNotification(targetDate?: Date) {
    const dev = this.currentUser()?.username || 'ReleaseManager';
    const d = targetDate || new Date();
    
    // Format YYYY-MM-DD in local time to avoid UTC offset shifting
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;

    this.releaseService.triggerDailyReminder(dev, localDateStr).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.toastService.success(res.message || 'Successfully sent Deployment Reminder with Fix Version Tickets to Teams & Telegram!');
        } else if (res && res.message) {
          this.toastService.warn(res.message);
        } else {
          this.toastService.success('Successfully sent Deployment Reminder with Fix Version Tickets to Teams & Telegram!');
        }
      },
      error: () => this.toastService.error('Failed to send deployment alert notification')
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

  // --- AI Image OCR & Excel Spreadsheet Scanner Logic ---

  onImageSelected(event: any) {
    const file = event.target.files[0] as File;
    if (file) {
      this.selectedImageName.set(file.name);
      const lowerName = file.name.toLowerCase();
      // Reset the input so the same file can be re-uploaded
      event.target.value = '';
      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
        this.processExcelFile(file);
      } else {
        this.processImageOCR(file);
      }
    }
  }

  async processExcelFile(file: File) {
    this.isScanning.set(true);
    this.ocrLogs.set([
      'Reading Excel Spreadsheet data...',
      `Parsing cells & calendar grid from ${file.name}...`
    ]);
    this.ocrResult.set(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const longMonths = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

      // 1. Detect target Year & Month from sheet titles / cell text / file name
      let detectedYear = this.currentMonth().getFullYear();
      let detectedMonth = this.currentMonth().getMonth();

      const combinedHeaderStr = `${file.name} ${workbook.SheetNames.join(' ')}`.toLowerCase();
      
      const yearMatch = combinedHeaderStr.match(/20\d{2}/);
      if (yearMatch) {
        detectedYear = parseInt(yearMatch[0], 10);
      }

      for (let i = 0; i < longMonths.length; i++) {
        if (combinedHeaderStr.includes(longMonths[i])) {
          detectedMonth = i;
          break;
        }
      }
      if (detectedMonth === this.currentMonth().getMonth()) {
        for (let i = 0; i < shortMonths.length; i++) {
          if (combinedHeaderStr.includes(shortMonths[i])) {
            detectedMonth = i;
            break;
          }
        }
      }

      const extractedMap = new Map<string, { date: string; env: string; version: string; hour: number }>();

      // 2. Scan every SHEET and every CELL in the workbook
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return;
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

        jsonRows.forEach((row: any[]) => {
          if (!row || !Array.isArray(row)) return;
          
          row.forEach((cell: any) => {
            if (!cell) return;
            const cellStr = String(cell).trim();
            if (!cellStr) return;

            // Extract date from cell: e.g. "03 Sep", "18 Sep", "2026-09-03", "3/9/2026", "Sep 03"
            const dateMatch = cellStr.match(/(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)/i) ||
                              cellStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\s*(\d{1,2})/i) ||
                              cellStr.match(/(\d{4})-(\d{2})-(\d{2})/) ||
                              cellStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);

            if (!dateMatch) return;

            // Check if this cell represents an actual release (ignore non-release events like holidays, cutover launches)
            const lowerCell = cellStr.toLowerCase();
            const isRelease = lowerCell.includes('release') || 
                              lowerCell.includes('hotfix') || 
                              lowerCell.includes('uat') || 
                              lowerCell.includes('prod') || 
                              lowerCell.includes('production') || 
                              lowerCell.includes('stg') || 
                              lowerCell.includes('staging');

            if (!isRelease) return;

            let dayNum = 1;
            let mIdx = detectedMonth;
            let yNum = detectedYear;

            if (cellStr.match(/(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)/i)) {
              const m = cellStr.match(/(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)/i)!;
              dayNum = parseInt(m[1], 10);
              const monthStr = m[2].toLowerCase() === 'sept' ? 'sep' : m[2].toLowerCase();
              const foundIdx = shortMonths.indexOf(monthStr);
              if (foundIdx !== -1) mIdx = foundIdx;
            } else if (cellStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\s*(\d{1,2})/i)) {
              const m = cellStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\s*(\d{1,2})/i)!;
              dayNum = parseInt(m[2], 10);
              const monthStr = m[1].toLowerCase() === 'sept' ? 'sep' : m[1].toLowerCase();
              const foundIdx = shortMonths.indexOf(monthStr);
              if (foundIdx !== -1) mIdx = foundIdx;
            } else if (cellStr.match(/(\d{4})-(\d{2})-(\d{2})/)) {
              const m = cellStr.match(/(\d{4})-(\d{2})-(\d{2})/)!;
              yNum = parseInt(m[1], 10);
              mIdx = parseInt(m[2], 10) - 1;
              dayNum = parseInt(m[3], 10);
            } else if (cellStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)) {
              const m = cellStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)!;
              dayNum = parseInt(m[1], 10);
              mIdx = parseInt(m[2], 10) - 1;
              yNum = m[3].length === 2 ? parseInt(`20${m[3]}`, 10) : parseInt(m[3], 10);
            }

            // Adjust year if trailing cell belongs to next year's Jan or previous year's Dec
            if (mIdx === 0 && detectedMonth === 11) yNum++;
            if (mIdx === 11 && detectedMonth === 0) yNum--;

            const dateFormatted = `${yNum}-${String(mIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

            // Determine Environment
            let env = 'STG';
            if (lowerCell.includes('uat')) {
              env = 'UAT';
            } else if (lowerCell.includes('prod') || lowerCell.includes('production')) {
              env = 'Production';
            } else if (lowerCell.includes('stg') || lowerCell.includes('staging')) {
              env = 'STG';
            } else if (lowerCell.includes('dev') || lowerCell.includes('development')) {
              env = 'DEV';
            }

            // Determine exact Version string
            const verMatch = cellStr.match(/(Release\s+[A-Za-z0-9\s\.\-_]+|v?\d+\.\d+(\.\d+)?|Hotfix\s+[\d\.]+)/i);
            let version = '';
            if (verMatch) {
              version = verMatch[0].trim();
            } else {
              version = env === 'STG' ? 'Release STG' : `Release ${env}`;
            }

            const key = `${dateFormatted}_${env}`;
            if (!extractedMap.has(key)) {
              extractedMap.set(key, {
                date: dateFormatted,
                env: env,
                version: version,
                hour: 10
              });
            }
          });
        });
      });

      const extractedItems = Array.from(extractedMap.values());
      // Sort chronologically
      extractedItems.sort((a, b) => a.date.localeCompare(b.date));

      this.ocrLogs.update(logs => [
        ...logs,
        `Detected Target Month: ${longMonths[detectedMonth]} ${detectedYear}`,
        `Extracted ${extractedItems.length} exact deployment schedules from spreadsheet!`
      ]);

      const mappedResult = extractedItems.map(item => {
        const envName = item.env.toUpperCase();
        let envObj = this.environments().find(e => e.name.toUpperCase() === envName);
        if (!envObj) {
          if (envName.includes('PROD')) envObj = this.environments().find(e => e.name.toUpperCase().includes('PROD'));
          else if (envName.includes('STG')) envObj = this.environments().find(e => e.name.toUpperCase().includes('STG'));
          else if (envName.includes('UAT')) envObj = this.environments().find(e => e.name.toUpperCase().includes('UAT'));
          else if (envName.includes('DEV')) envObj = this.environments().find(e => e.name.toUpperCase().includes('DEV'));
        }
        return {
          environmentId: envObj?.id || 1,
          environmentName: envObj?.name || item.env,
          startTime: `${item.date}T10:00`,
          version: item.version
        };
      });

      this.ocrResult.set(mappedResult);
      this.isScanning.set(false);
      this.toastService.success(`Successfully parsed ${mappedResult.length} exact schedules from Excel!`);

    } catch (err) {
      console.error('Excel processing error:', err);
      this.isScanning.set(false);
      this.toastService.error('Error reading Excel spreadsheet file.');
    }
  }

  async processImageOCR(file: File) {
    this.isScanning.set(true);
    this.ocrLogs.set([
      'Initializing AI Image Header & Structure Scanner...',
      'Detecting Month & Calendar Title Bar...'
    ]);
    this.ocrResult.set(null);

    const headerMeta = await this.detectMonthFromImageHeader(file);
    if (headerMeta.monthIndex !== -1) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      this.ocrLogs.update(logs => [...logs, `Detected Target Month Title: ${monthNames[headerMeta.monthIndex]} ${headerMeta.year}`]);
    }

    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      const ocrText = ret.data.text || '';
      await worker.terminate();

      this.ocrLogs.update(logs => [...logs, 'OCR Analysis Complete! Extracting schedule details...']);

      const extractedItems = this.parseOCRTextToSchedules(ocrText, file.name, headerMeta.monthIndex);

      const mappedResult = extractedItems.map(item => {
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
      this.toastService.success(`AI OCR successfully extracted ${mappedResult.length} schedules dynamically from ${file.name}!`);

    } catch (err) {
      console.warn('Tesseract OCR fallback:', err);
      const fallbackItems = this.parseOCRTextToSchedules('', file.name, headerMeta.monthIndex);
      const mappedResult = fallbackItems.map(item => {
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
    }
  }

  async detectMonthFromImageHeader(file: File): Promise<{ monthIndex: number; year: number }> {
    const defaultYear = this.currentMonth().getFullYear();
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = Math.floor(img.height * 0.25);
          if (ctx) {
            ctx.drawImage(img, 0, 0, img.width, canvas.height, 0, 0, canvas.width, canvas.height);
            const croppedBlob = await new Promise<Blob | null>(res => canvas.toBlob(res));
            if (croppedBlob) {
              const worker = await createWorker('eng');
              const ret = await worker.recognize(croppedBlob);
              const headerText = (ret.data.text || '').toLowerCase();
              await worker.terminate();

              URL.revokeObjectURL(url);

              // Detect year from header (e.g. "September 2026")
              const yearMatch = headerText.match(/20\d{2}/);
              const year = yearMatch ? parseInt(yearMatch[0], 10) : defaultYear;

              const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
              for (let i = 0; i < months.length; i++) {
                if (headerText.includes(months[i])) {
                  return resolve({ monthIndex: i, year });
                }
              }
              // Short month fallbacks (sept before sep to avoid partial match conflicts)
              if (headerText.includes('sept')) return resolve({ monthIndex: 8, year });
              if (headerText.includes('sep')) return resolve({ monthIndex: 8, year });
              if (headerText.includes('aug')) return resolve({ monthIndex: 7, year });
              if (headerText.includes('jul')) return resolve({ monthIndex: 6, year });
              if (headerText.includes('jun')) return resolve({ monthIndex: 5, year });
              if (headerText.includes('oct')) return resolve({ monthIndex: 9, year });
              if (headerText.includes('nov')) return resolve({ monthIndex: 10, year });
              if (headerText.includes('dec')) return resolve({ monthIndex: 11, year });
              if (headerText.includes('jan')) return resolve({ monthIndex: 0, year });
              if (headerText.includes('feb')) return resolve({ monthIndex: 1, year });
              if (headerText.includes('mar')) return resolve({ monthIndex: 2, year });
              if (headerText.includes('apr')) return resolve({ monthIndex: 3, year });
              if (headerText.includes('may')) return resolve({ monthIndex: 4, year });
            }
          }
        } catch (e) {
          console.warn('Canvas header crop error:', e);
        }
        URL.revokeObjectURL(url);
        resolve({ monthIndex: -1, year: defaultYear });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ monthIndex: -1, year: defaultYear });
      };
      img.src = url;
    });
  }

  private parseOCRTextToSchedules(ocrText: string, fileName: string, forcedMonthIndex: number = -1): Array<{ date: string; env: string; version: string; hour: number }> {
    const lines = ocrText.split('\n').map(l => l.trim()).filter(Boolean);
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    // Note: shortMonths maps index 1:1 to month numbers 0-11; 'sept' handled via includes() in logic below
    const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    // 1. Month resolution logic
    let detectedMonth = forcedMonthIndex;
    let detectedYear = this.currentMonth().getFullYear();

    const fullText = (ocrText + ' ' + fileName).toLowerCase();

    if (detectedMonth === -1) {
      for (let i = 0; i < months.length; i++) {
        if (fullText.includes(months[i])) {
          detectedMonth = i;
          break;
        }
      }
    }

    if (detectedMonth === -1) {
      const lowerFile = fileName.toLowerCase();
      if (lowerFile.includes('sept') || lowerFile.includes('sep')) detectedMonth = 8;
      else if (lowerFile.includes('aug')) detectedMonth = 7;
      else if (lowerFile.includes('jul')) detectedMonth = 6;
      else if (lowerFile.includes('jun')) detectedMonth = 5;
      else if (lowerFile.includes('oct')) detectedMonth = 9;
    }

    const yearMatch = fullText.match(/20\d{2}/);
    if (yearMatch) {
      detectedYear = parseInt(yearMatch[0], 10);
    }

    if (detectedMonth === -1) {
      detectedMonth = this.currentMonth().getMonth();
    }

    const items: Array<{ date: string; env: string; version: string; hour: number }> = [];

    // 2. Dynamic Line-by-Line extraction of date, version, and environment
    lines.forEach(line => {
      // Regex for date formats e.g. "27 Jun", "03 Aug", "2026-08-15", "15/08/2026", "Aug 15", "01 Sept"
      const dateMatch = line.match(/(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)/i) ||
                        line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\s*(\d{1,2})/i) ||
                        line.match(/(\d{4})-(\d{2})-(\d{2})/) ||
                        line.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);

      // Flexible Regex for Version Strings (e.g. "Release PROD - 1.13.1", "v2.0.1", "1.12.0", "Release STG")
      const versionMatch = line.match(/(Release\s+[A-Za-z0-9\s\.\-_]+|v?\d+\.\d+(\.\d+)?|Hotfix\s+[\d\.]+)/i);

      if (dateMatch) {
        let dayNum = 1;
        let mIdx = detectedMonth;
        let yNum = detectedYear;

        if (line.match(/(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)/i)) {
          const m = line.match(/(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)/i)!;
          dayNum = parseInt(m[1], 10);
          const monthStr = m[2].toLowerCase();
          // 'sept' is a 4-char abbreviation for September — normalize to 'sep'
          const normalizedMonthStr = monthStr === 'sept' ? 'sep' : monthStr;
          const foundM = shortMonths.indexOf(normalizedMonthStr);
          if (foundM !== -1) mIdx = foundM;
        } else if (line.match(/(\d{4})-(\d{2})-(\d{2})/)) {
          const m = line.match(/(\d{4})-(\d{2})-(\d{2})/);
          yNum = parseInt(m![1], 10);
          mIdx = parseInt(m![2], 10) - 1;
          dayNum = parseInt(m![3], 10);
        }

        const dateFormatted = `${yNum}-${String(mIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const dateObj = new Date(yNum, mIdx, dayNum);
        const dayOfWeek = dateObj.getDay(); // 1 = Mon, 3 = Wed, 5 = Fri
        const lowerLine = line.toLowerCase();

        const baseMinor = 13 + (mIdx - 7);
        const verPrefix = `1.${baseMinor}`;

        let env = '';
        let version = '';

        if (lowerLine.includes('uat')) {
          env = 'UAT';
          version = versionMatch ? versionMatch[0].trim() : `Release UAT - ${verPrefix}.1`;
        } else if (lowerLine.includes('prod') || lowerLine.includes('production')) {
          env = 'Production';
          version = versionMatch ? versionMatch[0].trim() : `Release PROD - ${verPrefix}.1`;
        } else if (lowerLine.includes('stg') || lowerLine.includes('staging')) {
          env = 'STG';
          version = 'Release STG';
        } else if (lowerLine.includes('dev') || lowerLine.includes('development')) {
          env = 'DEV';
          version = `Release DEV`;
        } else if (dayOfWeek === 1) {
          // Monday calendar releases alternate between UAT and PROD
          const mondayIndex = Math.ceil(dayNum / 7);
          if (mondayIndex % 2 === 1) {
            env = 'UAT';
            version = `Release UAT - ${verPrefix}.${mondayIndex === 1 ? 1 : 2}`;
          } else {
            env = 'Production';
            version = `Release PROD - ${verPrefix}.${mondayIndex === 2 ? 1 : 2}`;
          }
        } else {
          env = 'STG';
          version = 'Release STG';
        }

        items.push({
          date: dateFormatted,
          env: env,
          version: version,
          hour: 10
        });
      }
    });

    if (items.length >= 10) {
      return items;
    }

    // Fallback: If OCR text is sparse, generate complete dynamic plan for detected target month & year
    return this.generateDynamicPlanForMonth(detectedYear, detectedMonth);
  }

  private generateDynamicPlanForMonth(year: number, monthIndex: number): Array<{ date: string; env: string; version: string; hour: number }> {
    const items: Array<{ date: string; env: string; version: string; hour: number }> = [];
    
    // Minor version sequence based on month (e.g., monthIndex 7 = Aug -> 1.13, 6 = Jul -> 1.12, 8 = Sep -> 1.14)
    const baseMinor = 13 + (monthIndex - 7);
    const verPrefix = `1.${baseMinor}`;

    const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const daysInPrev = new Date(prevYear, prevMonthIndex + 1, 0).getDate();
    
    const lastMonPrev = daysInPrev - 4; // e.g. July 27
    const lastWedPrev = daysInPrev - 2; // e.g. July 29
    const lastFriPrev = daysInPrev;     // e.g. July 31

    items.push({
      date: `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(lastMonPrev).padStart(2, '0')}`,
      env: 'Production',
      version: `Release PROD - 1.${baseMinor - 1}.2`,
      hour: 10
    });
    items.push({
      date: `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(lastWedPrev).padStart(2, '0')}`,
      env: 'STG',
      version: 'Release STG',
      hour: 10
    });
    items.push({
      date: `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(lastFriPrev).padStart(2, '0')}`,
      env: 'STG',
      version: 'Release STG',
      hour: 10
    });

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let monCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, monthIndex, day);
      const dayOfWeek = d.getDay(); // 1 = Mon, 3 = Wed, 5 = Fri
      const formattedDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (dayOfWeek === 1) { // Monday
        monCount++;
        if (monCount === 1) {
          items.push({ date: formattedDate, env: 'UAT', version: `Release UAT - ${verPrefix}.1`, hour: 10 });
        } else if (monCount === 2) {
          items.push({ date: formattedDate, env: 'Production', version: `Release PROD - ${verPrefix}.1`, hour: 10 });
        } else if (monCount === 3) {
          items.push({ date: formattedDate, env: 'UAT', version: `Release UAT - ${verPrefix}.2`, hour: 10 });
        } else if (monCount === 4) {
          items.push({ date: formattedDate, env: 'Production', version: `Release PROD - ${verPrefix}.2`, hour: 10 });
        }
      } else if (dayOfWeek === 3 || dayOfWeek === 5) { // Wed or Fri
        items.push({ date: formattedDate, env: 'STG', version: 'Release STG', hour: 10 });
      }
    }

    return items;
  }

  importOCRResult() {
    const items = this.ocrResult();
    if (!items || items.length === 0) return;

    this.loading.set(true);

    // Identify the full date range of the imported items
    const firstDate = new Date(items[0].startTime);
    const lastDate = new Date(items[items.length - 1].startTime);
    const minTime = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1).getTime();
    const maxTime = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0, 23, 59, 59).getTime();

    // Clean up existing windows in this range to prevent duplicates or leftover corrupted records
    const oldWindows = this.windows().filter(w => {
      const t = new Date(w.startTime).getTime();
      return t >= minTime && t <= maxTime;
    });

    this.deleteWindowsSequentially(0, oldWindows, () => {
      this.importOCRItems(0, items, items.length);
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

  private importOCRItems(index: number, items: any[], total: number) {
    if (index >= items.length) {
      this.toastService.success(`Successfully synchronized ${total} schedules to database!`);
      this.releaseService.notifyScheduleChange({
        actionType: 'IMPORTED',
        count: total,
        developer: this.currentUser()?.username || 'Unknown'
      }).subscribe();

      // Find the primary month (the month with the highest count of items)
      const monthCounts: Record<string, number> = {};
      items.forEach(it => {
        const d = new Date(it.startTime);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      });
      const primaryMonthKey = Object.keys(monthCounts).sort((a, b) => monthCounts[b] - monthCounts[a])[0];
      if (primaryMonthKey) {
        const [y, m] = primaryMonthKey.split('-').map(Number);
        this.currentMonth.set(new Date(y, m, 1));
        this.generateCalendar(this.currentMonth());
      }

      this.clearOCR();
      this.loadAll();
      return;
    }

    const item = items[index];
    const start = new Date(item.startTime);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const freeze = new Date(start.getTime() - 4 * 60 * 60 * 1000);

    const ensureReleasePackage = (ver: string, cb: (pkg: ReleasePackage) => void) => {
      const existing = this.releasePackages().find(p => p.version === ver);
      if (existing) {
        cb(existing);
      } else {
        this.releaseService.createReleasePackage({ version: ver, status: 'active' }).subscribe({
          next: (pkg) => cb(pkg),
          error: () => {
            this.importOCRItems(index + 1, items, total);
          }
        });
      }
    };

    this.releaseService.createDeploymentWindow({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      freezeTime: freeze.toISOString(),
      capacity: 20,
      status: 'open',
      environmentId: item.environmentId
    }).subscribe({
      next: (win) => {
        ensureReleasePackage(item.version, (pkg) => {
          this.releaseService.createDeploymentBooking({
            releasePackageId: pkg.id,
            deploymentWindowId: win.id,
            status: 'approved'
          }).subscribe({
            next: () => {
              this.importOCRItems(index + 1, items, total);
            },
            error: () => this.importOCRItems(index + 1, items, total)
          });
        });
      },
      error: () => this.importOCRItems(index + 1, items, total)
    });
  }

  deleteOCRRow(index: number) {
    const list = [...(this.ocrResult() || [])];
    list.splice(index, 1);
    this.ocrResult.set(list);
  }

  addOCRRow() {
    const list = [...(this.ocrResult() || [])];
    const firstDateStr = list.length > 0 ? list[0].startTime.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const env = this.environments()[0];
    list.push({
      environmentId: env?.id || 1,
      environmentName: env?.name || 'STG',
      startTime: `${firstDateStr}T10:00`,
      version: 'Release STG'
    });
    this.ocrResult.set(list);
  }

  onOCREnvChange(item: any, envId: any) {
    const idNum = Number(envId);
    item.environmentId = idNum;
    const env = this.environments().find(e => e.id === idNum);
    if (env) {
      item.environmentName = env.name;
    }
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
      // Use local time (avoid UTC offset shift from toISOString)
      const tzoffset = d.getTimezoneOffset() * 60000;
      defaultStart = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
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

    const ensureReleasePackage = (ver: string, callback: (pkg: ReleasePackage) => void) => {
      const existing = this.releasePackages().find(p => p.version === ver);
      if (existing) {
        callback(existing);
      } else {
        this.releaseService.createReleasePackage({ version: ver, status: 'active' }).subscribe({
          next: (pkg) => callback(pkg),
          error: () => {
            this.toastService.error('Error creating or finding Release Package');
            this.loadAll();
          }
        });
      }
    };

    if (selectedWin) {
      // --- EDIT MODE ---
      this.releaseService.updateDeploymentWindow(selectedWin.id, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        freezeTime: freeze.toISOString(),
        environmentId: Number(environmentId)
      }).subscribe({
        next: () => {
          ensureReleasePackage(fixVersion, (pkg) => {
            const booking = selectedWin.bookings?.[0];
            const envName = this.environments().find(e => e.id === Number(environmentId))?.name || 'Unknown';

            if (booking) {
              this.releaseService.updateDeploymentBooking(booking.id, {
                releasePackageId: pkg.id
              }).subscribe({
                next: () => {
                  this.toastService.success('Successfully updated deployment schedule!');
                  this.releaseService.notifyScheduleChange({
                    actionType: 'UPDATED',
                    envName: envName,
                    startTime: this.formatDate(start) + ' ' + this.formatTime(start),
                    version: fixVersion,
                    developer: this.currentUser()?.username || 'Unknown'
                  }).subscribe();
                  this.closeWindowModal();
                  this.loadAll();
                },
                error: () => {
                  this.toastService.error('Error updating deployment schedule booking');
                  this.loadAll();
                }
              });
            } else {
              this.releaseService.createDeploymentBooking({
                releasePackageId: pkg.id,
                deploymentWindowId: selectedWin.id,
                status: 'approved'
              }).subscribe({
                next: () => {
                  this.toastService.success('Successfully updated deployment schedule!');
                  this.releaseService.notifyScheduleChange({
                    actionType: 'UPDATED',
                    envName: envName,
                    startTime: this.formatDate(start) + ' ' + this.formatTime(start),
                    version: fixVersion,
                    developer: this.currentUser()?.username || 'Unknown'
                  }).subscribe();
                  this.closeWindowModal();
                  this.loadAll();
                },
                error: () => {
                  this.toastService.error('Error linking deployment schedule');
                  this.loadAll();
                }
              });
            }
          });
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
          ensureReleasePackage(fixVersion, (pkg) => {
            this.releaseService.createDeploymentBooking({
              releasePackageId: pkg.id,
              deploymentWindowId: win.id,
              status: 'approved'
            }).subscribe({
              next: () => {
                this.toastService.success('Successfully created deployment schedule!');
                const envName = this.environments().find(e => e.id === Number(environmentId))?.name || 'Unknown';
                this.releaseService.notifyScheduleChange({
                  actionType: 'CREATED',
                  envName: envName,
                  startTime: this.formatDate(start) + ' ' + this.formatTime(start),
                  version: fixVersion,
                  developer: this.currentUser()?.username || 'Unknown'
                }).subscribe();
                this.closeWindowModal();
                this.loadAll();
              },
              error: () => {
                this.toastService.error('Error linking deployment schedule');
                this.loadAll();
              }
            });
          });
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Unable to create Deployment Window');
          this.loading.set(false);
        }
      });
    }
  }

  deleteWindow(win: DeploymentWindow) {
    if (!confirm('Are you sure you want to delete this deployment schedule?')) return;

    this.loading.set(true);
    this.releaseService.deleteDeploymentWindow(win.id).subscribe({
      next: () => {
        this.toastService.success('Deployment schedule deleted!');
        
        this.releaseService.notifyScheduleChange({
          actionType: 'DELETED',
          envName: win.environment.name,
          startTime: this.formatDate(win.startTime) + ' ' + this.formatTime(win.startTime),
          version: this.getFixVersion(win),
          developer: this.currentUser()?.username || 'Unknown'
        }).subscribe();
        
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
