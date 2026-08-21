export interface OrganizationSettingsResponse {
  id: string;
  name: string;
  purchaseOrdersEnabled: boolean;
}

export interface OrganizationSettingsUpdateRequest {
  name?: string | null;
  purchaseOrdersEnabled?: boolean | null;
}
