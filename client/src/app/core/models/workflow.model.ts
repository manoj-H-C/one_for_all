export interface StatusCategoryResponse {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  // null means nobody has explicitly picked one yet - falls back to the same
  // by-position color every category used to get (see categoryColorFor).
  color: string | null;
}

export interface StatusCategoryCreateRequest {
  name: string;
  description?: string | null;
  // optional - omit to have the backend auto-assign the next palette color,
  // same as before this was configurable.
  color?: string | null;
}

export interface StatusCategoryUpdateRequest {
  name?: string | null;
  description?: string | null;
  color?: string | null;
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
