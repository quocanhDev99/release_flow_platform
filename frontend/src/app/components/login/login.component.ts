import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Login form
  loginUsername = '';
  loginPassword = '';
  loginError = signal('');
  loginLoading = signal(false);
  showLoginPassword = false;

  // Forgot password form
  isForgotPasswordMode = signal(false);
  forgotEmail = '';
  forgotError = signal('');
  forgotSuccess = signal('');
  forgotLoading = signal(false);

  // Register form
  regUsername = '';
  regEmail = '';
  regPassword = '';
  regConfirmPassword = '';
  regError = signal('');
  regLoading = signal(false);
  showRegPassword = false;

  onForgotPassword() {
    if (!this.forgotEmail.trim()) {
      this.forgotError.set('Please enter your email address.');
      this.forgotSuccess.set('');
      return;
    }
    this.forgotLoading.set(true);
    this.forgotError.set('');
    this.forgotSuccess.set('');

    this.auth.forgotPassword(this.forgotEmail.trim()).subscribe({
      next: (res) => {
        this.forgotLoading.set(false);
        this.forgotSuccess.set('Success! If the email exists, a reset link has been logged in the backend console.');
        this.forgotEmail = '';
      },
      error: (err) => {
        this.forgotLoading.set(false);
        this.forgotError.set(err.error?.message || 'An error occurred. Please try again.');
      }
    });
  }

  onLogin() {
    if (!this.loginUsername.trim() || !this.loginPassword.trim()) {
      this.loginError.set('Please fill in all fields.');
      return;
    }
    this.loginLoading.set(true);
    this.loginError.set('');

    this.auth.login(this.loginUsername.trim(), this.loginPassword).subscribe({
      next: () => {
        this.loginLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loginLoading.set(false);
        this.loginError.set(err.error?.message || 'Invalid username or password.');
      },
    });
  }

  onRegister() {
    if (!this.regUsername.trim() || !this.regEmail.trim() || !this.regPassword.trim()) {
      this.regError.set('Please fill in all fields.');
      return;
    }
    if (this.regPassword !== this.regConfirmPassword) {
      this.regError.set('Passwords do not match.');
      return;
    }
    if (this.regPassword.length < 6) {
      this.regError.set('Password must be at least 6 characters.');
      return;
    }

    this.regLoading.set(true);
    this.regError.set('');

    this.auth.register(this.regUsername.trim(), this.regEmail.trim(), this.regPassword).subscribe({
      next: () => {
        this.regLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.regLoading.set(false);
        this.regError.set(err.error?.message || 'Registration failed. Try a different username.');
      },
    });
  }
}
