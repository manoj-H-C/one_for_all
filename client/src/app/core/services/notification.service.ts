import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Page } from '../models/common.model';
import { NotificationResponse } from '../models/notification.model';

const BASE = `${API_BASE_URL}/api/notifications`;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);

  list(unread: boolean, page: number, size: number): Observable<Page<NotificationResponse>> {
    const params = new HttpParams().set('unread', unread).set('page', page).set('size', size);
    return this.http.get<Page<NotificationResponse>>(BASE, { params });
  }

  markRead(id: string): Observable<void> {
    return this.http.patch<void>(`${BASE}/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${BASE}/read-all`, {});
  }
}
