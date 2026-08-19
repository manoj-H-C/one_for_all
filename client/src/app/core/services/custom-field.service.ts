import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { CustomFieldCreateRequest, CustomFieldResponse, CustomFieldUpdateRequest } from '../models/custom-field.model';

@Injectable({ providedIn: 'root' })
export class CustomFieldService {
  private readonly http = inject(HttpClient);

  private base(projectId: string): string {
    return `${API_BASE_URL}/api/projects/${projectId}/custom-fields`;
  }

  list(projectId: string): Observable<CustomFieldResponse[]> {
    return this.http.get<CustomFieldResponse[]>(this.base(projectId));
  }

  create(projectId: string, request: CustomFieldCreateRequest): Observable<CustomFieldResponse> {
    return this.http.post<CustomFieldResponse>(this.base(projectId), request);
  }

  update(projectId: string, fieldId: string, request: CustomFieldUpdateRequest): Observable<CustomFieldResponse> {
    return this.http.patch<CustomFieldResponse>(`${this.base(projectId)}/${fieldId}`, request);
  }

  delete(projectId: string, fieldId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(projectId)}/${fieldId}`);
  }
}
