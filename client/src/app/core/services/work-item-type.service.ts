import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { WorkItemTypeCreateRequest, WorkItemTypeResponse, WorkItemTypeUpdateRequest } from '../models/work-item-type.model';

@Injectable({ providedIn: 'root' })
export class WorkItemTypeService {
  private readonly http = inject(HttpClient);

  private base(projectId: string): string {
    return `${API_BASE_URL}/api/projects/${projectId}/work-item-types`;
  }

  list(projectId: string): Observable<WorkItemTypeResponse[]> {
    return this.http.get<WorkItemTypeResponse[]>(this.base(projectId));
  }

  create(projectId: string, request: WorkItemTypeCreateRequest): Observable<WorkItemTypeResponse> {
    return this.http.post<WorkItemTypeResponse>(this.base(projectId), request);
  }

  update(projectId: string, typeId: string, request: WorkItemTypeUpdateRequest): Observable<WorkItemTypeResponse> {
    return this.http.patch<WorkItemTypeResponse>(`${this.base(projectId)}/${typeId}`, request);
  }

  delete(projectId: string, typeId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(projectId)}/${typeId}`);
  }
}
