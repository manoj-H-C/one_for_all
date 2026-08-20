import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  StatusCategoryCreateRequest,
  StatusCategoryResponse,
  StatusCategoryUpdateRequest,
  WorkflowStatusCreateRequest,
  WorkflowStatusResponse,
  WorkflowStatusUpdateRequest,
} from '../models/workflow.model';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly http = inject(HttpClient);

  private base(projectId: string): string {
    return `${API_BASE_URL}/api/projects/${projectId}`;
  }

  listCategories(projectId: string): Observable<StatusCategoryResponse[]> {
    return this.http.get<StatusCategoryResponse[]>(`${this.base(projectId)}/status-categories`);
  }

  createCategory(projectId: string, request: StatusCategoryCreateRequest): Observable<StatusCategoryResponse> {
    return this.http.post<StatusCategoryResponse>(`${this.base(projectId)}/status-categories`, request);
  }

  updateCategory(
    projectId: string,
    categoryId: string,
    request: StatusCategoryUpdateRequest,
  ): Observable<StatusCategoryResponse> {
    return this.http.patch<StatusCategoryResponse>(`${this.base(projectId)}/status-categories/${categoryId}`, request);
  }

  deleteCategory(projectId: string, categoryId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(projectId)}/status-categories/${categoryId}`);
  }

  listStatuses(projectId: string): Observable<WorkflowStatusResponse[]> {
    return this.http.get<WorkflowStatusResponse[]>(`${this.base(projectId)}/workflow-statuses`);
  }

  createStatus(projectId: string, request: WorkflowStatusCreateRequest): Observable<WorkflowStatusResponse> {
    return this.http.post<WorkflowStatusResponse>(`${this.base(projectId)}/workflow-statuses`, request);
  }

  updateStatus(
    projectId: string,
    statusId: string,
    request: WorkflowStatusUpdateRequest,
  ): Observable<WorkflowStatusResponse> {
    return this.http.patch<WorkflowStatusResponse>(`${this.base(projectId)}/workflow-statuses/${statusId}`, request);
  }

  deleteStatus(projectId: string, statusId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(projectId)}/workflow-statuses/${statusId}`);
  }
}
