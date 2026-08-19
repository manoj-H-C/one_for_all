import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AttachmentCreateRequest, AttachmentResponse } from '../models/attachment.model';

const BASE = `${API_BASE_URL}/api`;

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private readonly http = inject(HttpClient);

  list(workItemId: string): Observable<AttachmentResponse[]> {
    return this.http.get<AttachmentResponse[]>(`${BASE}/work-items/${workItemId}/attachments`);
  }

  create(workItemId: string, request: AttachmentCreateRequest): Observable<AttachmentResponse> {
    return this.http.post<AttachmentResponse>(`${BASE}/work-items/${workItemId}/attachments`, request);
  }

  delete(attachmentId: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/attachments/${attachmentId}`);
  }
}
