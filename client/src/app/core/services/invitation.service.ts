import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { InvitationCreateRequest, InvitationResponse } from '../models/member.model';
import { MemberResponse } from '../models/member.model';

@Injectable({ providedIn: 'root' })
export class InvitationService {
  private readonly http = inject(HttpClient);

  create(projectId: string, request: InvitationCreateRequest): Observable<InvitationResponse> {
    return this.http.post<InvitationResponse>(`${API_BASE_URL}/api/projects/${projectId}/invitations`, request);
  }

  list(projectId: string): Observable<InvitationResponse[]> {
    return this.http.get<InvitationResponse[]>(`${API_BASE_URL}/api/projects/${projectId}/invitations`);
  }

  revoke(projectId: string, invitationId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/projects/${projectId}/invitations/${invitationId}`);
  }

  accept(token: string): Observable<MemberResponse> {
    return this.http.post<MemberResponse>(`${API_BASE_URL}/api/invitations/${token}/accept`, {});
  }
}
