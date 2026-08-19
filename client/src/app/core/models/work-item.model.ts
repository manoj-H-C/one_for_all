import { Priority } from './common.model';

export interface WorkItemResponse {
  id: string;
  projectId: string;
  statusId: string;
  statusName: string;
  assigneeId: string | null;
  reporterId: string | null;
  sprintId: string | null;
  sprintName: string | null;
  typeId: string | null;
  typeName: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItemCreateRequest {
  title: string;
  description?: string | null;
  statusId?: string | null;
  assigneeId?: string | null;
  // optional - omit to leave the item unreported. Must be an existing
  // project member when given, same rule as assigneeId.
  reporterId?: string | null;
  // optional - omit to leave it in the backlog. Must be a sprint that
  // belongs to this project when given.
  sprintId?: string | null;
  // optional - omit to leave it untyped. Must be a work item type that
  // belongs to this project when given.
  typeId?: string | null;
  priority?: Priority | null;
  dueDate?: string | null;
  customFields?: Record<string, unknown> | null;
}

export interface WorkItemUpdateRequest {
  title?: string | null;
  description?: string | null;
  priority?: Priority | null;
  dueDate?: string | null;
  customFields?: Record<string, unknown> | null;
}

export interface WorkItemFilter {
  statusId?: string;
  assigneeId?: string;
  reporterId?: string;
  sprintId?: string;
  typeId?: string;
  priority?: Priority;
  q?: string;
}

export interface WorkItemActivityResponse {
  id: string;
  actorId: string;
  actorName: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}
