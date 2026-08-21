import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  InventoryBalanceResponse,
  InventoryLocationCreateRequest,
  InventoryLocationResponse,
  InventoryLocationUpdateRequest,
  InventoryMaterialCreateRequest,
  InventoryMaterialResponse,
  InventoryMaterialUpdateRequest,
  InventoryMovementCreateRequest,
  InventoryMovementResponse,
  InventoryTransferRequest,
  SupplyRequestCreateRequest,
  SupplyRequestDecisionRequest,
  SupplyRequestResponse,
  SupplyRequestStatus,
} from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);

  private base(projectId: string): string {
    return `${API_BASE_URL}/api/projects/${projectId}/inventory`;
  }

  listLocations(projectId: string): Observable<InventoryLocationResponse[]> {
    return this.http.get<InventoryLocationResponse[]>(`${this.base(projectId)}/locations`);
  }

  createLocation(projectId: string, request: InventoryLocationCreateRequest): Observable<InventoryLocationResponse> {
    return this.http.post<InventoryLocationResponse>(`${this.base(projectId)}/locations`, request);
  }

  updateLocation(projectId: string, locationId: string, request: InventoryLocationUpdateRequest): Observable<InventoryLocationResponse> {
    return this.http.patch<InventoryLocationResponse>(`${this.base(projectId)}/locations/${locationId}`, request);
  }

  deleteLocation(projectId: string, locationId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(projectId)}/locations/${locationId}`);
  }

  listMaterials(projectId: string): Observable<InventoryMaterialResponse[]> {
    return this.http.get<InventoryMaterialResponse[]>(`${this.base(projectId)}/materials`);
  }

  createMaterial(projectId: string, request: InventoryMaterialCreateRequest): Observable<InventoryMaterialResponse> {
    return this.http.post<InventoryMaterialResponse>(`${this.base(projectId)}/materials`, request);
  }

  updateMaterial(projectId: string, materialId: string, request: InventoryMaterialUpdateRequest): Observable<InventoryMaterialResponse> {
    return this.http.patch<InventoryMaterialResponse>(`${this.base(projectId)}/materials/${materialId}`, request);
  }

  deleteMaterial(projectId: string, materialId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(projectId)}/materials/${materialId}`);
  }

  listMovements(projectId: string, locationId?: string, materialId?: string): Observable<InventoryMovementResponse[]> {
    let params = new HttpParams();
    if (locationId) params = params.set('locationId', locationId);
    if (materialId) params = params.set('materialId', materialId);
    return this.http.get<InventoryMovementResponse[]>(`${this.base(projectId)}/movements`, { params });
  }

  createMovement(projectId: string, request: InventoryMovementCreateRequest): Observable<InventoryMovementResponse> {
    return this.http.post<InventoryMovementResponse>(`${this.base(projectId)}/movements`, request);
  }

  transferStock(projectId: string, request: InventoryTransferRequest): Observable<InventoryMovementResponse[]> {
    return this.http.post<InventoryMovementResponse[]>(`${this.base(projectId)}/transfer`, request);
  }

  listBalances(projectId: string, locationId?: string): Observable<InventoryBalanceResponse[]> {
    let params = new HttpParams();
    if (locationId) params = params.set('locationId', locationId);
    return this.http.get<InventoryBalanceResponse[]>(`${this.base(projectId)}/balances`, { params });
  }

  private requestsBase(projectId: string): string {
    return `${API_BASE_URL}/api/projects/${projectId}/supply-requests`;
  }

  listSupplyRequests(projectId: string, status?: SupplyRequestStatus, mine?: boolean): Observable<SupplyRequestResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (mine) params = params.set('mine', 'true');
    return this.http.get<SupplyRequestResponse[]>(this.requestsBase(projectId), { params });
  }

  createSupplyRequest(projectId: string, request: SupplyRequestCreateRequest): Observable<SupplyRequestResponse> {
    return this.http.post<SupplyRequestResponse>(this.requestsBase(projectId), request);
  }

  approveSupplyRequest(projectId: string, requestId: string, body: SupplyRequestDecisionRequest = {}): Observable<SupplyRequestResponse> {
    return this.http.post<SupplyRequestResponse>(`${this.requestsBase(projectId)}/${requestId}/approve`, body);
  }

  rejectSupplyRequest(projectId: string, requestId: string, body: SupplyRequestDecisionRequest = {}): Observable<SupplyRequestResponse> {
    return this.http.post<SupplyRequestResponse>(`${this.requestsBase(projectId)}/${requestId}/reject`, body);
  }

  fulfillSupplyRequest(projectId: string, requestId: string, body: SupplyRequestDecisionRequest = {}): Observable<SupplyRequestResponse> {
    return this.http.post<SupplyRequestResponse>(`${this.requestsBase(projectId)}/${requestId}/fulfill`, body);
  }

  cancelSupplyRequest(projectId: string, requestId: string, body: SupplyRequestDecisionRequest = {}): Observable<SupplyRequestResponse> {
    return this.http.post<SupplyRequestResponse>(`${this.requestsBase(projectId)}/${requestId}/cancel`, body);
  }
}
