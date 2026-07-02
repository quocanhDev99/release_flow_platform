import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DeploymentItem, ReleaseStream, Ticket } from '../models/release.model';

@Injectable({
  providedIn: 'root'
})
export class ReleaseService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api'; // Đường dẫn API Backend NestJS

  // Dashboard / Deployment Items (Excel-like Grid rows)
  getDeploymentItems(params?: { repoId?: number; releaseId?: number }): Observable<DeploymentItem[]> {
    return this.http.get<DeploymentItem[]>(`${this.apiUrl}/deployment-items`, { params });
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
}
