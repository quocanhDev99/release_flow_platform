import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  iconFor(type: Toast['type']): string {
    const icons: Record<Toast['type'], string> = {
      success: 'check_circle',
      error:   'error',
      warn:    'warning',
      info:    'info'
    };
    return icons[type];
  }

  trackById(_: number, toast: Toast) { return toast.id; }
}
