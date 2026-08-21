export interface PermissionResponse {
  code: string;
  description: string;
}

export interface RoleResponse {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  permissionCodes: string[];
}

export interface RoleCreateRequest {
  name: string;
  description?: string | null;
}

export interface RoleUpdateRequest {
  name?: string | null;
  description?: string | null;
}

export interface SetRolePermissionsRequest {
  permissionCodes: string[];
}

export const PERMISSION_CODE = {
  WORK_ITEM_CREATE: 'WORK_ITEM_CREATE',
  WORK_ITEM_EDIT: 'WORK_ITEM_EDIT',
  WORK_ITEM_DELETE: 'WORK_ITEM_DELETE',
  WORK_ITEM_ASSIGN: 'WORK_ITEM_ASSIGN',
  COMMENT_CREATE: 'COMMENT_CREATE',
  MEMBER_INVITE: 'MEMBER_INVITE',
  MEMBER_REMOVE: 'MEMBER_REMOVE',
  ROLE_MANAGE: 'ROLE_MANAGE',
  WORKFLOW_MANAGE: 'WORKFLOW_MANAGE',
  CUSTOM_FIELD_MANAGE: 'CUSTOM_FIELD_MANAGE',
  PROJECT_MANAGE: 'PROJECT_MANAGE',
  INVENTORY_MANAGE: 'INVENTORY_MANAGE',
} as const;

export type PermissionCode = (typeof PERMISSION_CODE)[keyof typeof PERMISSION_CODE];
