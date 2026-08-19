import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  PermissionResponse,
  RoleCreateRequest,
  RoleResponse,
  RoleUpdateRequest,
  SetRolePermissionsRequest,
} from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);

  private base(projectId: string): string {
    return `${API_BASE_URL}/api/projects/${projectId}/roles`;
  }

  listPermissionCatalog(): Observable<PermissionResponse[]> {
    return this.http.get<PermissionResponse[]>(`${API_BASE_URL}/api/permissions`);
  }

  list(projectId: string): Observable<RoleResponse[]> {
    return this.http.get<RoleResponse[]>(this.base(projectId));
  }

  create(projectId: string, request: RoleCreateRequest): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(this.base(projectId), request);
  }

  update(projectId: string, roleId: string, request: RoleUpdateRequest): Observable<RoleResponse> {
    return this.http.patch<RoleResponse>(`${this.base(projectId)}/${roleId}`, request);
  }

  delete(projectId: string, roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(projectId)}/${roleId}`);
  }

  setPermissions(projectId: string, roleId: string, request: SetRolePermissionsRequest): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`${this.base(projectId)}/${roleId}/permissions`, request);
  }
}
