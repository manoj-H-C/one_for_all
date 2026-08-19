export interface StatusCategoryResponse {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
}

export interface StatusCategoryCreateRequest {
  name: string;
  description?: string | null;
}

export interface StatusCategoryUpdateRequest {
  name?: string | null;
  description?: string | null;
}

export interface WorkflowStatusResponse {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
  categoryId: string;
  categoryName: string;
}

export interface WorkflowStatusCreateRequest {
  name: string;
  sortOrder: number;
  categoryId: string;
}

export interface WorkflowStatusUpdateRequest {
  name?: string | null;
  sortOrder?: number | null;
  categoryId?: string | null;
}
