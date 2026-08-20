import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { MemberAddRequest, MemberResponse, UpdateMemberRoleRequest } from '../models/member.model';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private readonly http = inject(HttpClient);

  private base(projectId: string): string {
    return `${API_BASE_URL}/api/projects/${projectId}/members`;
  }

  list(projectId: string): Observable<MemberResponse[]> {
    return this.http.get<MemberResponse[]>(this.base(projectId));
  }

  // adds an existing org member straight to the project (no email/token
  // round-trip) - the backend requires the userId to already belong to the
  // same org as the project, otherwise it 400s.
  add(projectId: string, request: MemberAddRequest): Observable<MemberResponse> {
    return this.http.post<MemberResponse>(this.base(projectId), request);
  }

  updateRole(projectId: string, userId: string, request: UpdateMemberRoleRequest): Observable<MemberResponse> {
    return this.http.patch<MemberResponse>(`${this.base(projectId)}/${userId}`, request);
  }

  remove(projectId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(projectId)}/${userId}`);
  }
}
