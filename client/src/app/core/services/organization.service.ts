import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthResponse } from '../models/auth.model';
import {
  OrganizationInvitationAcceptRequest,
  OrganizationInvitationCreateRequest,
  OrganizationInvitationResponse,
  OrganizationMemberCreateRequest,
  OrganizationMemberCreateResponse,
  OrganizationMemberResponse,
} from '../models/organization.model';

const BASE = `${API_BASE_URL}/api`;

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly http = inject(HttpClient);

  listMembers(): Observable<OrganizationMemberResponse[]> {
    return this.http.get<OrganizationMemberResponse[]>(`${BASE}/organizations/members`);
  }

  // creates the account immediately with a system-generated temporary
  // password (returned once in the response) instead of an email invite.
  createMember(request: OrganizationMemberCreateRequest): Observable<OrganizationMemberCreateResponse> {
    return this.http.post<OrganizationMemberCreateResponse>(`${BASE}/organizations/members`, request);
  }

  // removes every one of the user's project memberships and blocks them
  // from logging in again - their existing session is invalidated on the
  // very next request too. The org owner and your own account can't be
  // deleted this way (the backend rejects both).
  deleteMember(userId: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/organizations/members/${userId}`);
  }

  setProjectCreationAccess(userId: string, canCreateProjects: boolean): Observable<void> {
    return this.http.patch<void>(`${BASE}/users/${userId}/project-creation-access`, { canCreateProjects });
  }

  setMemberManagementAccess(userId: string, canManageMembers: boolean): Observable<void> {
    return this.http.patch<void>(`${BASE}/users/${userId}/member-management-access`, { canManageMembers });
  }

  createInvitation(request: OrganizationInvitationCreateRequest): Observable<OrganizationInvitationResponse> {
    return this.http.post<OrganizationInvitationResponse>(`${BASE}/organizations/invitations`, request);
  }

  listInvitations(): Observable<OrganizationInvitationResponse[]> {
    return this.http.get<OrganizationInvitationResponse[]>(`${BASE}/organizations/invitations`);
  }

  revokeInvitation(invitationId: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/organizations/invitations/${invitationId}`);
  }

  acceptInvitation(token: string, request: OrganizationInvitationAcceptRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE}/organizations/invitations/${token}/accept`, request);
  }
}
