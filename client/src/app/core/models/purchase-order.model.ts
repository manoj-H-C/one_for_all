export const PURCHASE_ORDER_STATUSES = ['ORDERED', 'RECEIVED', 'CANCELLED'] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export interface PurchaseOrderLineResponse {
  supplyRequestId: string;
  projectId: string;
  projectName: string;
  materialName: string;
  unit: string;
  locationName: string;
  quantity: number;
  requestedById: string;
  requestedByName: string;
  note: string | null;
}

export interface PurchaseOrderResponse {
  id: string;
  organizationId: string;
  vendorName: string;
  note: string | null;
  status: PurchaseOrderStatus;
  createdById: string;
  createdByName: string;
  createdAt: string;
  closedById: string | null;
  closedByName: string | null;
  closedAt: string | null;
  lines: PurchaseOrderLineResponse[];
}

export interface PurchaseOrderCreateRequest {
  vendorName: string;
  note?: string | null;
  requestIds: string[];
}
