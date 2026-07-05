import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';

const AVATAR_STORAGE_KEY = 'rfp_user_avatar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ToastComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);
  showPassword = false;
  avatarUrl = signal<string | null>(null);

  /** Derives "JD" style initials from current username */
  avatarInitials = computed(() => {
    const name = this.username.trim();
    if (!name) return '?';
    const parts = name.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.username = user.username;
    this.email = user.email;

    // Restore saved avatar from localStorage
    const savedAvatar = localStorage.getItem(`${AVATAR_STORAGE_KEY}_${user.id}`);
    if (savedAvatar) {
      this.avatarUrl.set(savedAvatar);
    }
  }

  triggerAvatarUpload() {
    this.avatarInput?.nativeElement.click();
  }

  onAvatarFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    // Validate type and size (max 2MB)
    if (!file.type.startsWith('image/')) {
      this.toast.error('Please select a valid image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.toast.error('Image must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.avatarUrl.set(dataUrl);

      // Persist in localStorage (keyed by user ID)
      const user = this.auth.getCurrentUser();
      if (user) {
        localStorage.setItem(`${AVATAR_STORAGE_KEY}_${user.id}`, dataUrl);
      }
      this.toast.success('Profile photo updated.');
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    input.value = '';
  }

  onUpdate() {
    if (!this.username.trim() || !this.email.trim()) {
      this.toast.error('Please enter both username and email.');
      return;
    }

    if (this.password) {
      if (this.password.length < 6) {
        this.toast.error('Password must be at least 6 characters long.');
        return;
      }
      if (this.password !== this.confirmPassword) {
        this.toast.error('Passwords do not match.');
        return;
      }
    }

    this.loading.set(true);

    const updateData: any = {
      username: this.username.trim(),
      email: this.email.trim(),
    };

    if (this.password) {
      updateData.password = this.password;
    }

    this.auth.updateProfile(updateData).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Profile updated successfully.');
        this.password = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Failed to update profile.');
      }
    });
  }

  onBack() {
    this.router.navigate(['/']);
  }
}
