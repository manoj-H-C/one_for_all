import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { OrganizationSettingsResponse, OrganizationSettingsUpdateRequest } from '../models/organization-settings.model';

const BASE = `${API_BASE_URL}/api/organizations/settings`;

@Injectable({ providedIn: 'root' })
export class OrganizationSettingsService {
  private readonly http = inject(HttpClient);

  get(): Observable<OrganizationSettingsResponse> {
    return this.http.get<OrganizationSettingsResponse>(BASE);
  }

  update(request: OrganizationSettingsUpdateRequest): Observable<OrganizationSettingsResponse> {
    return this.http.patch<OrganizationSettingsResponse>(BASE, request);
  }
}
