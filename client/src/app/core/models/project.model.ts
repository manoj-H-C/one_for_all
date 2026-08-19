export interface ProjectResponse {
  id: string;
  orgId: string;
  name: string;
  key: string;
  templateType: string | null;
  itemDisplayNameSingular: string;
  itemDisplayNamePlural: string;
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
}
