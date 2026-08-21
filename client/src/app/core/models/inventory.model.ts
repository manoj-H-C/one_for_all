export interface InventoryLocationResponse {
  id: string;
  projectId: string;
  parentLocationId: string | null;
  name: string;
  createdAt: string;
}

export interface InventoryLocationCreateRequest {
  name: string;
  parentLocationId?: string | null;
}

export interface InventoryLocationUpdateRequest {
  name?: string | null;
}

export interface InventoryMaterialResponse {
  id: string;
  projectId: string;
  name: string;
  unit: string;
  sku: string | null;
  lowStockThreshold: number | null;
  description: string | null;
  createdAt: string;
}

export interface InventoryMaterialCreateRequest {
  name: string;
  unit: string;
  sku?: string | null;
  lowStockThreshold?: number | null;
  description?: string | null;
}

export interface InventoryMaterialUpdateRequest {
  name?: string | null;
  unit?: string | null;
  sku?: string | null;
  lowStockThreshold?: number | null;
  description?: string | null;
}

export const MOVEMENT_TYPES = ['ALLOCATED', 'USED', 'RETURNED'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export interface InventoryMovementResponse {
  id: string;
  materialId: string;
  materialName: string;
  unit: string;
  locationId: string;
  locationName: string;
  quantity: number;
  type: MovementType;
  note: string | null;
  workItemId: string | null;
  recordedById: string;
  recordedByName: string;
  recordedAt: string;
}

export interface InventoryMovementCreateRequest {
  materialId: string;
  locationId: string;
  quantity: number;
  type: MovementType;
  note?: string | null;
  workItemId?: string | null;
}

export interface InventoryTransferRequest {
  materialId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  note?: string | null;
}

export interface InventoryBalanceResponse {
  materialId: string;
  materialName: string;
  unit: string;
  locationId: string;
  locationName: string;
  allocated: number;
  used: number;
  returned: number;
  remaining: number;
}

export const SUPPLY_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED'] as const;
export type SupplyRequestStatus = (typeof SUPPLY_REQUEST_STATUSES)[number];

export interface SupplyRequestResponse {
  id: string;
  projectId: string;
  materialId: string;
  materialName: string;
  unit: string;
  locationId: string;
  locationName: string;
  quantity: number;
  status: SupplyRequestStatus;
  note: string | null;
  requestedById: string;
  requestedByName: string;
  requestedAt: string;
  decisionNote: string | null;
  decidedById: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  fulfilledMovementId: string | null;
}

export interface SupplyRequestCreateRequest {
  materialId: string;
  locationId: string;
  quantity: number;
  note?: string | null;
}

export interface SupplyRequestDecisionRequest {
  note?: string | null;
}
