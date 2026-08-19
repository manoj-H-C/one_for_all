import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { CommentCreateRequest, CommentResponse, CommentUpdateRequest } from '../models/comment.model';

const BASE = `${API_BASE_URL}/api`;

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);

  list(workItemId: string): Observable<CommentResponse[]> {
    return this.http.get<CommentResponse[]>(`${BASE}/work-items/${workItemId}/comments`);
  }

  create(workItemId: string, request: CommentCreateRequest): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`${BASE}/work-items/${workItemId}/comments`, request);
  }

  update(commentId: string, request: CommentUpdateRequest): Observable<CommentResponse> {
    return this.http.patch<CommentResponse>(`${BASE}/comments/${commentId}`, request);
  }

  delete(commentId: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/comments/${commentId}`);
  }
}
