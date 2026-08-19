import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Page } from '../models/common.model';
import {
  WorkItemActivityResponse,
  WorkItemCreateRequest,
  WorkItemFilter,
  WorkItemResponse,
  WorkItemUpdateRequest,
} from '../models/work-item.model';

const BASE = `${API_BASE_URL}/api`;

@Injectable({ providedIn: 'root' })
export class WorkItemService {
  private readonly http = inject(HttpClient);

  create(projectId: string, request: WorkItemCreateRequest): Observable<WorkItemResponse> {
    return this.http.post<WorkItemResponse>(`${BASE}/projects/${projectId}/work-items`, request);
  }

  list(
    projectId: string,
    filter: WorkItemFilter,
    page: number,
    size: number,
    sort = 'createdAt,desc',
  ): Observable<Page<WorkItemResponse>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    if (filter.statusId) params = params.set('statusId', filter.statusId);
    if (filter.assigneeId) params = params.set('assigneeId', filter.assigneeId);
    if (filter.reporterId) params = params.set('reporterId', filter.reporterId);
    if (filter.sprintId) params = params.set('sprintId', filter.sprintId);
    if (filter.priority) params = params.set('priority', filter.priority);
    if (filter.q) params = params.set('q', filter.q);
    return this.http.get<Page<WorkItemResponse>>(`${BASE}/projects/${projectId}/work-items`, { params });
  }

  get(id: string): Observable<WorkItemResponse> {
    return this.http.get<WorkItemResponse>(`${BASE}/work-items/${id}`);
  }

  update(id: string, request: WorkItemUpdateRequest): Observable<WorkItemResponse> {
    return this.http.patch<WorkItemResponse>(`${BASE}/work-items/${id}`, request);
  }

  updateStatus(id: string, statusId: string): Observable<WorkItemResponse> {
    return this.http.patch<WorkItemResponse>(`${BASE}/work-items/${id}/status`, { statusId });
  }

  updateAssignee(id: string, assigneeId: string | null): Observable<WorkItemResponse> {
    return this.http.patch<WorkItemResponse>(`${BASE}/work-items/${id}/assignee`, { assigneeId });
  }

  updateReporter(id: string, reporterId: string | null): Observable<WorkItemResponse> {
    return this.http.patch<WorkItemResponse>(`${BASE}/work-items/${id}/reporter`, { reporterId });
  }

  updateSprint(id: string, sprintId: string | null): Observable<WorkItemResponse> {
    return this.http.patch<WorkItemResponse>(`${BASE}/work-items/${id}/sprint`, { sprintId });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/work-items/${id}`);
  }

  getActivity(id: string, page: number, size: number): Observable<Page<WorkItemActivityResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<WorkItemActivityResponse>>(`${BASE}/work-items/${id}/activity`, { params });
  }
}
