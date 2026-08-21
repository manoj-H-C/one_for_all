import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { SupplyRequestResponse } from '../models/inventory.model';
import { PurchaseOrderCreateRequest, PurchaseOrderResponse, PurchaseOrderStatus } from '../models/purchase-order.model';

const BASE = `${API_BASE_URL}/api/organizations/purchase-orders`;

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);

  listOrderableRequests(): Observable<SupplyRequestResponse[]> {
    return this.http.get<SupplyRequestResponse[]>(`${BASE}/orderable-requests`);
  }

  list(status?: PurchaseOrderStatus): Observable<PurchaseOrderResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<PurchaseOrderResponse[]>(BASE, { params });
  }

  create(request: PurchaseOrderCreateRequest): Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(BASE, request);
  }

  receive(orderId: string): Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(`${BASE}/${orderId}/receive`, {});
  }

  cancel(orderId: string): Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(`${BASE}/${orderId}/cancel`, {});
  }
}
