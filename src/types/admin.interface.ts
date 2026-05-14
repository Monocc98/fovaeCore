import type { BaseRole } from "./authResponse.interface";

export type AdminUserRole = "STANDARD";
export type AdminUserStatus = "active" | "disabled";
export type AdminUserStatusFilter = AdminUserStatus | "all";
export type AdminMembershipStatus = "active" | "disabled" | "invited";
export type AdminWritableMembershipStatus = Exclude<AdminMembershipStatus, "invited">;

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUsersPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminUsersQuery {
  page: number;
  limit: number;
  search?: string;
  status?: AdminUserStatusFilter;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  pagination: AdminUsersPagination;
}

export interface AdminUserResponse {
  user: AdminUser;
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateAdminUserPayload {
  name?: string;
  email?: string;
}

export interface AdminAccountPermission {
  accountId: string;
  canView: boolean;
  canEdit: boolean;
}

export interface AdminCompanyPermission {
  companyId: string;
  membershipId: string;
  status: AdminMembershipStatus;
  baseRole: BaseRole;
  dividendShare: number;
  accounts: AdminAccountPermission[];
}

export interface AdminPermissionsPayloadCompany {
  companyId: string;
  status: AdminWritableMembershipStatus;
  baseRole: BaseRole;
  dividendShare: number;
  accounts: AdminAccountPermission[];
}

export interface AdminUserPermissions {
  globalRole: AdminUserRole;
  companyPermissions: AdminCompanyPermission[];
}

export interface AdminUserPermissionsResponse {
  userId: string;
  status: AdminUserStatus;
  permissions: AdminUserPermissions;
}

export interface UpdateAdminUserPermissionsPayload {
  globalRole: AdminUserRole;
  companyPermissions: AdminPermissionsPayloadCompany[];
}

export interface DeactivateAdminUserResponse {
  user: AdminUser;
  revokedSessions: number;
}
