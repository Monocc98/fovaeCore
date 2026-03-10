import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createAdminUserAction,
  deactivateAdminUserAction,
  getAdminUserByIdAction,
  getAdminUserPermissionsAction,
  getAdminUsersAction,
  updateAdminUserAction,
  updateAdminUserPermissionsAction,
} from "../actions";
import type {
  AdminUser,
  AdminUserPermissionsResponse,
  AdminUsersQuery,
  AdminUsersResponse,
  CreateAdminUserPayload,
  DeactivateAdminUserResponse,
  UpdateAdminUserPayload,
  UpdateAdminUserPermissionsPayload,
} from "@/types";

const adminUsersBaseKey = ["admin", "users"] as const;

export const adminUsersQueryKey = (params: AdminUsersQuery) =>
  [
    ...adminUsersBaseKey,
    params.page,
    params.limit,
    params.search?.trim() ?? "",
    params.status ?? "all",
  ] as const;

export const adminUserQueryKey = (userId?: string) =>
  [...adminUsersBaseKey, userId ?? "unknown"] as const;

export const adminUserPermissionsQueryKey = (userId?: string) =>
  [...adminUserQueryKey(userId), "permissions"] as const;

export const useAdminUsers = (
  params: AdminUsersQuery
): UseQueryResult<AdminUsersResponse> =>
  useQuery({
    queryKey: adminUsersQueryKey(params),
    queryFn: () => getAdminUsersAction(params),
    placeholderData: (previousData) => previousData,
  });

export const useAdminUser = (userId?: string): UseQueryResult<AdminUser> =>
  useQuery({
    queryKey: adminUserQueryKey(userId),
    queryFn: () => getAdminUserByIdAction(userId!),
    enabled: Boolean(userId),
  });

export const useAdminUserPermissions = (
  userId?: string
): UseQueryResult<AdminUserPermissionsResponse> =>
  useQuery({
    queryKey: adminUserPermissionsQueryKey(userId),
    queryFn: () => getAdminUserPermissionsAction(userId!),
    enabled: Boolean(userId),
  });

export const useCreateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminUserPayload) => createAdminUserAction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersBaseKey });
    },
  });
};

export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateAdminUserPayload;
    }) => updateAdminUserAction(userId, payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: adminUsersBaseKey });
      queryClient.setQueryData(adminUserQueryKey(user.id), user);
    },
  });
};

export const useDeactivateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deactivateAdminUserAction(userId),
    onSuccess: (response: DeactivateAdminUserResponse) => {
      queryClient.invalidateQueries({ queryKey: adminUsersBaseKey });
      queryClient.setQueryData(adminUserQueryKey(response.user.id), response.user);
    },
  });
};

export const useUpdateAdminUserPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateAdminUserPermissionsPayload;
    }) => updateAdminUserPermissionsAction(userId, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: adminUsersBaseKey });

      if (response) {
        queryClient.setQueryData(
          adminUserPermissionsQueryKey(variables.userId),
          response
        );
      } else {
        queryClient.invalidateQueries({
          queryKey: adminUserPermissionsQueryKey(variables.userId),
        });
      }
    },
  });
};
