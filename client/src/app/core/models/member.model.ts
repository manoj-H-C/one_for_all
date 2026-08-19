export interface MemberResponse {
  userId: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
}

export interface UpdateMemberRoleRequest {
  roleId: string;
}

export interface MemberAddRequest {
  userId: string;
  roleId: string;
}

export interface InvitationResponse {
  id: string;
  projectId: string;
  email: string;
  roleId: string;
  roleName: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationCreateRequest {
  email: string;
  roleId: string;
}
