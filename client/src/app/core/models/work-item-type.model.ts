export interface WorkItemTypeResponse {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
}

export interface WorkItemTypeCreateRequest {
  name: string;
}

export interface WorkItemTypeUpdateRequest {
  name?: string | null;
}
