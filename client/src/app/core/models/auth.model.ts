export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  orgId: string;
  email: string;
  name: string;
}

export interface UserResponse {
  id: string;
  orgId: string;
  orgName: string;
  purchaseOrdersEnabled: boolean;
  email: string;
  name: string;
  owner: boolean;
  canCreateProjects: boolean;
  canManageMembers: boolean;
  emailVerified: boolean;
  mustResetPassword: boolean;
  createdAt: string;
}

export interface RegisterRequest {
  orgName: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
