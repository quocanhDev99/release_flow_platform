import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DeploymentItem, ReleaseStream, Ticket, Repository, User } from '../models/release.model';

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
}
