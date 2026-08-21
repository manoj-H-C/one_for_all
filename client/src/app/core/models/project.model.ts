export interface ProjectResponse {
  id: string;
  orgId: string;
  name: string;
  key: string;
  templateType: string | null;
  itemDisplayNameSingular: string;
  itemDisplayNamePlural: string;
  sprintLabelSingular: string;
  sprintLabelPlural: string;
  inventoryEnabled: boolean;
  inventoryLabelSingular: string;
  inventoryLabelPlural: string;
  createdAt: string;
}

export interface ProjectCreateRequest {
  name: string;
  key: string;
  templateType?: string | null;
}

export interface ProjectUpdateRequest {
  name?: string | null;
  itemDisplayNameSingular?: string | null;
  itemDisplayNamePlural?: string | null;
  sprintLabelSingular?: string | null;
  sprintLabelPlural?: string | null;
  inventoryEnabled?: boolean | null;
  inventoryLabelSingular?: string | null;
  inventoryLabelPlural?: string | null;
}
