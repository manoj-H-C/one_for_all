import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ProjectCreateRequest, ProjectResponse, ProjectUpdateRequest } from '../models/project.model';

const BASE = `${API_BASE_URL}/api/projects`;

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);

  create(request: ProjectCreateRequest): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(BASE, request);
  }

  list(): Observable<ProjectResponse[]> {
    return this.http.get<ProjectResponse[]>(BASE);
  }

  get(id: string): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`${BASE}/${id}`);
  }

  update(id: string, request: ProjectUpdateRequest): Observable<ProjectResponse> {
    return this.http.patch<ProjectResponse>(`${BASE}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
