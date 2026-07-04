import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/release.model';

const STORAGE_KEY = 'rfp_current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://release-flow-backend-z76u.onrender.com/api'; // Thay thế bằng URL thực tế sau khi tạo Web Service trên Render

  private _currentUser: User | null = null;

  constructor() {
    // Restore from localStorage on init
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this._currentUser = JSON.parse(raw);
      } catch {
        this._currentUser = null;
      }
    }
  }

  getCurrentUser(): User | null {
    return this._currentUser;
  }

  isLoggedIn(): boolean {
    return this._currentUser !== null;
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/login`, { username, password }).pipe(
      tap(user => this.setUser(user))
    );
  }

  register(username: string, email: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/register`, { username, email, password }).pipe(
      tap(user => this.setUser(user))
    );
  }

  updateTheme(theme: string): Observable<User> {
    const user = this._currentUser;
    if (!user) throw new Error('Not logged in');
    return this.http.patch<User>(`${this.apiUrl}/users/${user.id}/theme`, { theme }).pipe(
      tap(updated => this.setUser({ ...this._currentUser!, theme: updated.theme }))
    );
  }

  logout(): void {
    this._currentUser = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  private setUser(user: User): void {
    this._currentUser = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
}
