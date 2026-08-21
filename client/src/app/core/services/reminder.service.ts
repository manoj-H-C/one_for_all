import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ReminderCreateRequest, ReminderResponse, ReminderStatus } from '../models/reminder.model';

const BASE = `${API_BASE_URL}/api`;

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly http = inject(HttpClient);

  listForWorkItem(workItemId: string): Observable<ReminderResponse[]> {
    return this.http.get<ReminderResponse[]>(`${BASE}/work-items/${workItemId}/reminders`);
  }

  create(workItemId: string, request: ReminderCreateRequest): Observable<ReminderResponse> {
    return this.http.post<ReminderResponse>(`${BASE}/work-items/${workItemId}/reminders`, request);
  }

  listMine(status?: ReminderStatus): Observable<ReminderResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ReminderResponse[]>(`${BASE}/reminders/mine`, { params });
  }

  dismiss(reminderId: string): Observable<void> {
    return this.http.post<void>(`${BASE}/reminders/${reminderId}/dismiss`, {});
  }
}
