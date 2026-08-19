import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { WorkItemLinkCreateRequest, WorkItemLinkResponse } from '../models/work-item-link.model';

const BASE = `${API_BASE_URL}/api`;

@Injectable({ providedIn: 'root' })
export class WorkItemLinkService {
  private readonly http = inject(HttpClient);

  list(workItemId: string): Observable<WorkItemLinkResponse[]> {
    return this.http.get<WorkItemLinkResponse[]>(`${BASE}/work-items/${workItemId}/links`);
  }

  create(workItemId: string, request: WorkItemLinkCreateRequest): Observable<WorkItemLinkResponse> {
    return this.http.post<WorkItemLinkResponse>(`${BASE}/work-items/${workItemId}/links`, request);
  }

  delete(workItemId: string, linkId: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/work-items/${workItemId}/links/${linkId}`);
  }
}
