import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warn' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  private show(type: ToastType, message: string, duration = 4000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.toasts.update(list => [...list, { id, type, message, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string, duration?: number) { this.show('success', message, duration); }
  error(message: string, duration?: number)   { this.show('error',   message, duration ?? 6000); }
  warn(message: string, duration?: number)    { this.show('warn',    message, duration); }
  info(message: string, duration?: number)    { this.show('info',    message, duration); }

  dismiss(id: string) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
