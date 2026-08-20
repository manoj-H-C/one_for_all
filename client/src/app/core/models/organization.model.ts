export interface OrganizationMemberResponse {
  id: string;
  name: string;
  email: string;
  owner: boolean;
  canCreateProjects: boolean;
  canManageMembers: boolean;
  createdAt: string;
}

export interface OrganizationInvitationResponse {
  id: string;
  orgId: string;
  email: string;
  invitedById: string;
  canCreateProjects: boolean;
  canManageMembers: boolean;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface OrganizationInvitationCreateRequest {
  email: string;
  canCreateProjects: boolean;
  canManageMembers: boolean;
}

export interface OrganizationInvitationAcceptRequest {
  name: string;
  password: string;
}

export interface UpdateProjectCreationAccessRequest {
  canCreateProjects: boolean;
}

export interface UpdateMemberManagementAccessRequest {
  canManageMembers: boolean;
}

export interface OrganizationMemberCreateRequest {
  name: string;
  email: string;
  canCreateProjects: boolean;
  canManageMembers: boolean;
}

// temporaryPassword is shown exactly once - the caller must display/copy it
// immediately, it can never be retrieved again after this response.
export interface OrganizationMemberCreateResponse {
  id: string;
  name: string;
  email: string;
  canCreateProjects: boolean;
  canManageMembers: boolean;
  temporaryPassword: string;
  createdAt: string;
}

// rowNumber matches the row the person would see if they opened the
// uploaded file in a spreadsheet app (header row is row 1), so a failure
// can be reported back against something they recognize.
export interface OrganizationMemberBulkCreateRow {
  rowNumber: number;
  name: string;
  email: string;
  canCreateProjects: boolean;
  canManageMembers: boolean;
}

export interface OrganizationMemberBulkCreateFailure {
  rowNumber: number;
  name: string;
  email: string;
  reason: string;
}

export interface OrganizationMemberBulkCreateResult {
  created: OrganizationMemberCreateResponse[];
  failed: OrganizationMemberBulkCreateFailure[];
}

export interface OrganizationInvitationBulkCreateRow {
  rowNumber: number;
  email: string;
  canCreateProjects: boolean;
  canManageMembers: boolean;
}

export interface OrganizationInvitationBulkCreateFailure {
  rowNumber: number;
  email: string;
  reason: string;
}

export interface OrganizationInvitationBulkCreateResult {
  created: OrganizationInvitationResponse[];
  failed: OrganizationInvitationBulkCreateFailure[];
}
