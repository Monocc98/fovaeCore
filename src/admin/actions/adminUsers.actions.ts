import { fovaeCoreApi } from "@/api/fovaeCore.api";
import { normalizeIdDeep } from "@/helpers";
import type {
  AdminUser,
  AdminUserPermissionsResponse,
  AdminUserResponse,
  AdminUsersQuery,
  AdminUsersResponse,
  CreateAdminUserPayload,
  DeactivateAdminUserResponse,
  UpdateAdminUserPayload,
  UpdateAdminUserPermissionsPayload,
} from "@/types";

const ADMIN_USERS_BASE = "/admin/users";

const normalizeAdminUser = (payload: AdminUserResponse | AdminUser): AdminUser =>
  normalizeIdDeep("user" in payload ? payload.user : payload);

export const getAdminUsersAction = async (
  params: AdminUsersQuery
): Promise<AdminUsersResponse> => {
  const queryParams = new URLSearchParams();

  queryParams.set("page", String(params.page));
  queryParams.set("limit", String(params.limit));

  if (params.search?.trim()) {
    queryParams.set("search", params.search.trim());
  }

  if (params.status && params.status !== "all") {
    queryParams.set("status", params.status);
  } else if (params.status === "all") {
    queryParams.set("status", "all");
  }

  const { data } = await fovaeCoreApi.get<AdminUsersResponse>(
    `${ADMIN_USERS_BASE}?${queryParams.toString()}`
  );

  return normalizeIdDeep(data);
};

export const getAdminUserByIdAction = async (userId: string): Promise<AdminUser> => {
  const { data } = await fovaeCoreApi.get<AdminUserResponse>(
    `${ADMIN_USERS_BASE}/${userId}`
  );

  return normalizeAdminUser(data);
};

export const createAdminUserAction = async (
  payload: CreateAdminUserPayload
): Promise<AdminUser> => {
  const { data } = await fovaeCoreApi.post<AdminUserResponse | AdminUser>(
    ADMIN_USERS_BASE,
    payload
  );

  return normalizeAdminUser(data);
};

export const updateAdminUserAction = async (
  userId: string,
  payload: UpdateAdminUserPayload
): Promise<AdminUser> => {
  const { data } = await fovaeCoreApi.patch<AdminUserResponse | AdminUser>(
    `${ADMIN_USERS_BASE}/${userId}`,
    payload
  );

  return normalizeAdminUser(data);
};

export const deactivateAdminUserAction = async (
  userId: string
): Promise<DeactivateAdminUserResponse> => {
  const { data } = await fovaeCoreApi.patch<DeactivateAdminUserResponse>(
    `${ADMIN_USERS_BASE}/${userId}/deactivate`
  );

  return normalizeIdDeep(data);
};

export const getAdminUserPermissionsAction = async (
  userId: string
): Promise<AdminUserPermissionsResponse> => {
  const { data } = await fovaeCoreApi.get<AdminUserPermissionsResponse>(
    `${ADMIN_USERS_BASE}/${userId}/permissions`
  );

  return normalizeIdDeep(data);
};

export const updateAdminUserPermissionsAction = async (
  userId: string,
  payload: UpdateAdminUserPermissionsPayload
): Promise<AdminUserPermissionsResponse | null> => {
  const { data } = await fovaeCoreApi.put<AdminUserPermissionsResponse | null>(
    `${ADMIN_USERS_BASE}/${userId}/permissions`,
    {
      ...payload,
      globalRole: "STANDARD",
    }
  );

  return data ? normalizeIdDeep(data) : null;
};
