import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { SprintCreateRequest, SprintResponse, SprintUpdateRequest } from '../models/sprint.model';

@Injectable({ providedIn: 'root' })
export class SprintService {
  private readonly http = inject(HttpClient);

  private base(projectId: string): string {
    return `${API_BASE_URL}/api/projects/${projectId}/sprints`;
  }

  list(projectId: string): Observable<SprintResponse[]> {
    return this.http.get<SprintResponse[]>(this.base(projectId));
  }

  create(projectId: string, request: SprintCreateRequest): Observable<SprintResponse> {
    return this.http.post<SprintResponse>(this.base(projectId), request);
  }

  update(projectId: string, sprintId: string, request: SprintUpdateRequest): Observable<SprintResponse> {
    return this.http.patch<SprintResponse>(`${this.base(projectId)}/${sprintId}`, request);
  }

  delete(projectId: string, sprintId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(projectId)}/${sprintId}`);
  }
}
