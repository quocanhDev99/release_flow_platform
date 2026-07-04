import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  token = '';
  password = '';
  confirmPassword = '';
  showPassword = false;

  loading = signal(false);
  error = signal('');
  success = signal('');

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.error.set('Invalid or missing password reset token. Please request a new one.');
    }
  }

  onReset() {
    if (!this.password.trim()) {
      this.error.set('Please enter a new password.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.auth.resetPassword(this.token, this.password.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Password has been reset successfully! Redirecting you to login...');
        this.toast.success('Password reset successfully.');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2500);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to reset password. The link may have expired.');
      },
    });
  }
}
