export interface SprintResponse {
  id: string;
  projectId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface SprintCreateRequest {
  name: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface SprintUpdateRequest {
  name?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}
