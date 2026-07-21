import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DeploymentItem, ReleaseStream, Ticket, Repository, User, ReleasePackage, DeploymentWindow, DeploymentBooking, DeploymentPolicy } from '../models/release.model';

@Injectable({
  providedIn: 'root'
})
export class ReleaseService {
  private http = inject(HttpClient);
  private apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://release-flow-backend-z76u.onrender.com/api'; // Đường dẫn API Backend NestJS (Thay thế bằng URL Render của bạn)

  // Dashboard / Deployment Items (Excel-like Grid rows)
  getDeploymentItems(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    repoName?: string;
    releaseVersion?: string;
    qcStatus?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Observable<{ data: DeploymentItem[]; total: number; page: number; pageSize: number }> {
    return this.http.get<any>(`${this.apiUrl}/deployment-items`, { params });
  }

  getDeploymentItemById(id: number): Observable<DeploymentItem> {
    return this.http.get<DeploymentItem>(`${this.apiUrl}/deployment-items/${id}`);
  }

  createDeploymentItem(data: any): Observable<DeploymentItem> {
    return this.http.post<DeploymentItem>(`${this.apiUrl}/deployment-items`, data);
  }

  updateDeploymentItem(id: number, data: any): Observable<DeploymentItem> {
    return this.http.put<DeploymentItem>(`${this.apiUrl}/deployment-items/${id}`, data);
  }

  patchMergeDevel(id: number, isMergedOnDevel: boolean): Observable<DeploymentItem> {
    return this.http.patch<DeploymentItem>(`${this.apiUrl}/deployment-items/${id}/merge-devel`, { isMergedOnDevel });
  }

  deleteDeploymentItem(id: number): Observable<void> {
    return this.http.delete<void>(`${`${this.apiUrl}/deployment-items`}/${id}`);
  }

  bulkDeleteDeploymentItems(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/deployment-items/bulk-delete`, { ids });
  }

  bulkUpdateDeploymentItems(payload: any): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/deployment-items/bulk-update`, payload);
  }

  patchQCStatus(ticketId: number, qcStatus: string): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/tickets/${ticketId}/qc`, { qcStatus });
  }

  // Release Streams (Fix versions)
  getReleases(): Observable<ReleaseStream[]> {
    return this.http.get<ReleaseStream[]>(`${this.apiUrl}/releases`);
  }

  createRelease(version: string): Observable<ReleaseStream> {
    return this.http.post<ReleaseStream>(`${this.apiUrl}/releases`, { version });
  }

  deleteRelease(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/releases/${id}`);
  }

  // Repositories
  getRepositories(): Observable<Repository[]> {
    return this.http.get<Repository[]>(`${this.apiUrl}/repositories`);
  }

  createRepository(name: string, gitUrl?: string): Observable<Repository> {
    return this.http.post<Repository>(`${this.apiUrl}/repositories`, { name, gitUrl });
  }

  deleteRepository(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/repositories/${id}`);
  }

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  updateUserTheme(userId: number, theme: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${userId}/theme`, { theme });
  }

  // Bulk Create
  bulkCreateDeploymentItems(items: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/deployment-items/bulk`, items);
  }

  // Environments
  getEnvironments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/environments`);
  }

  createEnvironment(name: string, description?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/environments`, { name, description });
  }

  deleteEnvironment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/environments/${id}`);
  }

  // System Settings
  getSettings(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.apiUrl}/settings`);
  }

  updateSettings(data: Record<string, string>): Observable<Record<string, string>> {
    return this.http.post<Record<string, string>>(`${this.apiUrl}/settings/bulk`, data);
  }

  testNotification(type: 'telegram' | 'email' | 'teams' | 'slack'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/settings/test-notification`, { type });
  }

  // Release Packages
  getReleasePackages(): Observable<ReleasePackage[]> {
    return this.http.get<ReleasePackage[]>(`${this.apiUrl}/release-packages`);
  }

  getReleasePackageById(id: number): Observable<ReleasePackage> {
    return this.http.get<ReleasePackage>(`${this.apiUrl}/release-packages/${id}`);
  }

  createReleasePackage(data: { version: string; buildArtifactHash?: string; status?: string }): Observable<ReleasePackage> {
    return this.http.post<ReleasePackage>(`${this.apiUrl}/release-packages`, data);
  }

  updateReleasePackage(id: number, data: { version?: string; buildArtifactHash?: string; status?: string }): Observable<ReleasePackage> {
    return this.http.put<ReleasePackage>(`${this.apiUrl}/release-packages/${id}`, data);
  }

  deleteReleasePackage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/release-packages/${id}`);
  }

  // Deployment Windows
  getDeploymentWindows(): Observable<DeploymentWindow[]> {
    return this.http.get<DeploymentWindow[]>(`${this.apiUrl}/deployment-windows`);
  }

  getDeploymentWindowById(id: number): Observable<DeploymentWindow> {
    return this.http.get<DeploymentWindow>(`${this.apiUrl}/deployment-windows/${id}`);
  }

  createDeploymentWindow(data: {
    startTime: string;
    endTime: string;
    freezeTime: string;
    capacity?: number;
    status?: string;
    policyId?: number;
    environmentId: number;
  }): Observable<DeploymentWindow> {
    return this.http.post<DeploymentWindow>(`${this.apiUrl}/deployment-windows`, data);
  }

  updateDeploymentWindow(id: number, data: Partial<DeploymentWindow>): Observable<DeploymentWindow> {
    return this.http.put<DeploymentWindow>(`${this.apiUrl}/deployment-windows/${id}`, data);
  }

  deleteDeploymentWindow(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deployment-windows/${id}`);
  }

  notifyScheduleChange(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/deployment-windows/notify`, data);
  }

  // Deployment Policies
  getDeploymentPolicies(): Observable<DeploymentPolicy[]> {
    return this.http.get<DeploymentPolicy[]>(`${this.apiUrl}/deployment-windows/policies/all`);
  }

  createDeploymentPolicy(data: {
    name: string;
    cronSchedule: string;
    targetEnvironment: string;
    capacityLimit?: number;
    freezeWindow?: number;
  }): Observable<DeploymentPolicy> {
    return this.http.post<DeploymentPolicy>(`${this.apiUrl}/deployment-windows/policies`, data);
  }

  deleteDeploymentPolicy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deployment-windows/policies/${id}`);
  }

  // Deployment Bookings
  getDeploymentBookings(): Observable<DeploymentBooking[]> {
    return this.http.get<DeploymentBooking[]>(`${this.apiUrl}/deployment-bookings`);
  }

  createDeploymentBooking(data: {
    releasePackageId: number;
    deploymentWindowId: number;
    status?: string;
  }): Observable<DeploymentBooking> {
    return this.http.post<DeploymentBooking>(`${this.apiUrl}/deployment-bookings`, data);
  }

  updateDeploymentBookingStatus(id: number, status: string): Observable<DeploymentBooking> {
    return this.http.put<DeploymentBooking>(`${this.apiUrl}/deployment-bookings/${id}`, { status });
  }

  deleteDeploymentBooking(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deployment-bookings/${id}`);
  }
}
