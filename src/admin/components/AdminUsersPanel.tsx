import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  Loader2,
  RefreshCw,
  Save,
  Search,
  UserPlus,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminUser,
  useAdminUserPermissions,
  useAdminUsers,
  useCreateAdminUser,
  useDeactivateAdminUser,
  useUpdateAdminUser,
  useUpdateAdminUserPermissions,
} from "../hooks";
import type {
  AdminAccountPermission,
  AdminUserPermissionsResponse,
  AdminUserStatusFilter,
  HomeResponse,
  UpdateAdminUserPermissionsPayload,
} from "@/types";
import { getErrorMessage } from "@/helpers";

type Props = { overlay: HomeResponse };

type CompanyOption = {
  id: string;
  name: string;
  groupName: string;
  accounts: Array<{ id: string; name: string }>;
};

const PAGE_SIZE = 8;

const errorMessage = (error: unknown, fallback: string) =>
  getErrorMessage(error, fallback);

const toDraft = (
  response: AdminUserPermissionsResponse
): UpdateAdminUserPermissionsPayload => ({
  globalRole: "STANDARD",
  companyPermissions: response.permissions.companyPermissions.map((company) => ({
    companyId: company.companyId,
    status: company.status === "active" ? "active" : "disabled",
    baseRole: company.baseRole,
    accounts: company.accounts.map((account) => ({
      accountId: account.accountId,
      canView: account.canView,
      canEdit: account.canEdit,
    })),
  })),
});

export const AdminUsersPanel = ({ overlay }: Props) => {
  const companies = useMemo<CompanyOption[]>(() => {
    const map = new Map<string, CompanyOption>();
    for (const group of overlay.groups) {
      for (const company of group.companies) {
        if (map.has(company.id)) continue;
        map.set(company.id, {
          id: company.id,
          name: company.name,
          groupName: group.name,
          accounts: company.accounts.map((account) => ({
            id: account.id,
            name: account.name,
          })),
        });
      }
    }
    return Array.from(map.values());
  }, [overlay.groups]);

  const companiesById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies]
  );

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const [statusFilter, setStatusFilter] = useState<AdminUserStatusFilter>("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [permissionsDraft, setPermissionsDraft] =
    useState<UpdateAdminUserPermissionsPayload | null>(null);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter]);

  const usersQuery = useAdminUsers({
    page,
    limit: PAGE_SIZE,
    search: deferredSearch.trim(),
    status: statusFilter,
  });
  const users = usersQuery.data?.items ?? [];
  const pagination = usersQuery.data?.pagination;

  useEffect(() => {
    if (!selectedUserId && users.length > 0) setSelectedUserId(users[0].id);
  }, [selectedUserId, users]);

  const userQuery = useAdminUser(selectedUserId);
  const permissionsQuery = useAdminUserPermissions(selectedUserId);
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const deactivateUser = useDeactivateAdminUser();
  const updatePermissions = useUpdateAdminUserPermissions();

  const selectedUser =
    userQuery.data ?? users.find((user) => user.id === selectedUserId) ?? null;

  useEffect(() => {
    setPermissionsDraft(null);
    const fallbackUser = users.find((user) => user.id === selectedUserId);
    if (fallbackUser) {
      setEditForm({ name: fallbackUser.name, email: fallbackUser.email });
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    if (!userQuery.data) return;
    setEditForm({ name: userQuery.data.name, email: userQuery.data.email });
  }, [userQuery.data]);

  useEffect(() => {
    if (!permissionsQuery.data) return;
    setPermissionsDraft(toDraft(permissionsQuery.data));
  }, [permissionsQuery.data]);

  const buildAccounts = (
    companyId: string,
    existing: AdminAccountPermission[] = []
  ) => {
    const options = new Map<string, { id: string; name: string }>();
    for (const account of companiesById.get(companyId)?.accounts ?? []) {
      options.set(account.id, account);
    }
    for (const account of existing) {
      if (options.has(account.accountId)) continue;
      options.set(account.accountId, {
        id: account.accountId,
        name: `Cuenta ${account.accountId.slice(0, 8)}`,
      });
    }
    return Array.from(options.values()).map((account) => {
      const current = existing.find((item) => item.accountId === account.id);
      return {
        accountId: account.id,
        canView: current?.canView ?? false,
        canEdit: current?.canEdit ?? false,
      };
    });
  };

  const patchPermissionRow = (
    index: number,
    updater: (
      row: UpdateAdminUserPermissionsPayload["companyPermissions"][number]
    ) => UpdateAdminUserPermissionsPayload["companyPermissions"][number]
  ) => {
    setPermissionsDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        companyPermissions: current.companyPermissions.map((row, rowIndex) =>
          rowIndex === index ? updater(row) : row
        ),
      };
    });
  };

  const addCompanyPermission = () => {
    setPermissionsDraft((current) => {
      const base = current ?? { globalRole: "STANDARD" as const, companyPermissions: [] };
      const used = new Set(base.companyPermissions.map((item) => item.companyId));
      const firstAvailable =
        companies.find((company) => !used.has(company.id)) ?? companies[0];
      const companyId = firstAvailable?.id ?? "";
      return {
        ...base,
        companyPermissions: [
          ...base.companyPermissions,
          {
            companyId,
            status: "active",
            baseRole: "VIEWER",
            accounts: buildAccounts(companyId),
          },
        ],
      };
    });
  };

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      toast.error("Completa nombre, email y contrasena.");
      return;
    }
    try {
      const user = await createUser.mutateAsync({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
      });
      setCreateForm({ name: "", email: "", password: "" });
      setSelectedUserId(user.id);
      setPage(1);
      toast.success("Usuario creado.");
    } catch (error) {
      toast.error(errorMessage(error, "No se pudo crear el usuario."));
    }
  };

  const saveUser = async () => {
    if (!selectedUser) return;
    const payload: { name?: string; email?: string } = {};
    if (editForm.name.trim() && editForm.name.trim() !== selectedUser.name) {
      payload.name = editForm.name.trim();
    }
    if (editForm.email.trim() && editForm.email.trim() !== selectedUser.email) {
      payload.email = editForm.email.trim();
    }
    if (!payload.name && !payload.email) {
      toast.message("No hay cambios para guardar.");
      return;
    }
    try {
      await updateUser.mutateAsync({ userId: selectedUser.id, payload });
      toast.success("Usuario actualizado.");
    } catch (error) {
      toast.error(errorMessage(error, "No se pudo actualizar el usuario."));
    }
  };

  const disableUser = async () => {
    if (!selectedUser || selectedUser.status === "disabled") return;
    if (
      !window.confirm(
        `Se desactivara a ${selectedUser.name} y se cerraran sus sesiones activas.`
      )
    ) {
      return;
    }
    try {
      const response = await deactivateUser.mutateAsync(selectedUser.id);
      toast.success(`Usuario desactivado. Sesiones revocadas: ${response.revokedSessions}.`);
    } catch (error) {
      toast.error(errorMessage(error, "No se pudo desactivar el usuario."));
    }
  };

  const savePermissions = async () => {
    if (!selectedUserId || !permissionsDraft) return;
    try {
      await updatePermissions.mutateAsync({
        userId: selectedUserId,
        payload: {
          globalRole: "STANDARD",
          companyPermissions: permissionsDraft.companyPermissions
            .filter((company) => company.companyId.trim())
            .map((company) => ({
              companyId: company.companyId,
              status: company.status,
              baseRole: company.baseRole,
              accounts: company.accounts.map((account) => ({ ...account })),
            })),
        },
      });
      toast.success("Permisos actualizados.");
    } catch (error) {
      toast.error(errorMessage(error, "No se pudieron guardar los permisos."));
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Usuarios</h2>
            <p className="text-sm text-slate-500">Fuente: /api/admin/users</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => usersQuery.refetch()}
            disabled={usersQuery.isFetching}
          >
            {usersQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <form className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={submitCreate}>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <UserPlus className="h-4 w-4" />
            Crear Usuario
          </div>
          <Input
            value={createForm.name}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Nombre"
          />
          <Input
            value={createForm.email}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="Email"
            type="email"
          />
          <Input
            value={createForm.password}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, password: event.target.value }))
            }
            placeholder="Contrasena temporal"
            type="password"
          />
          <Button type="submit" className="w-full" disabled={createUser.isPending}>
            {createUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear
          </Button>
        </form>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar usuario"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AdminUserStatusFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="disabled">Desactivados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 space-y-2">
          {!usersQuery.isLoading && users.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
              No hay usuarios para este filtro.
            </div>
          )}
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelectedUserId(user.id)}
              className={[
                "w-full rounded-2xl border p-4 text-left transition-colors",
                user.id === selectedUserId
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="font-medium">{user.name}</div>
              <div className={user.id === selectedUserId ? "text-sm text-slate-300" : "text-sm text-slate-500"}>
                {user.email}
              </div>
              <div className={user.id === selectedUserId ? "mt-2 text-xs text-slate-300" : "mt-2 text-xs text-slate-500"}>
                {user.status === "active" ? "Activo" : "Desactivado"} - {user.role}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-600">
          <span>
            Pagina {pagination?.page ?? page} de {pagination?.pages ?? 1}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1 || usersQuery.isFetching}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((current) => Math.min(current + 1, pagination?.pages ?? current + 1))
              }
              disabled={page >= (pagination?.pages ?? 1) || usersQuery.isFetching}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Detalle</h2>
              <p className="text-sm text-slate-500">Edicion de datos basicos</p>
            </div>
            {selectedUser && (
              <span
                className={
                  selectedUser.status === "active"
                    ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                    : "rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"
                }
              >
                {selectedUser.status === "active" ? "Activo" : "Desactivado"}
              </span>
            )}
          </div>

          {!selectedUser && (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Selecciona un usuario.
            </div>
          )}

          {selectedUser && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Nombre
                </label>
                <Input
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Email
                </label>
                <Input
                  value={editForm.email}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, email: event.target.value }))
                  }
                  type="email"
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Button type="button" onClick={saveUser} disabled={updateUser.isPending}>
                  {updateUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar Datos
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={disableUser}
                  disabled={deactivateUser.isPending || selectedUser.status === "disabled"}
                >
                  {deactivateUser.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserX className="h-4 w-4" />
                  )}
                  Desactivar
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Permisos</h2>
              <p className="text-sm text-slate-500">
                Se envia el set completo de companyPermissions.
              </p>
            </div>
            <Button
              type="button"
              onClick={savePermissions}
              disabled={!selectedUserId || !permissionsDraft || updatePermissions.isPending}
            >
              {updatePermissions.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar Permisos
            </Button>
          </div>

          {!selectedUserId && (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Selecciona un usuario para cargar permisos.
            </div>
          )}

          {selectedUserId && permissionsQuery.isLoading && (
            <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 animate-pulse">
              <div className="h-5 w-44 rounded bg-slate-200" />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="h-10 rounded bg-white" />
                <div className="h-10 rounded bg-white" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-14 rounded-xl bg-white" />
                ))}
              </div>
            </div>
          )}

          {selectedUserId && permissionsDraft && (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Rol global fijo: <strong>STANDARD</strong>. El backend rechaza SUPER_ADMIN.
              </div>

              {permissionsDraft.companyPermissions.map((company, index) => {
                const companyInfo = companiesById.get(company.companyId);
                const accountOptions = buildAccounts(company.companyId, company.accounts);

                return (
                  <div key={`${company.companyId || "empty"}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Building2 className="h-4 w-4" />
                        {companyInfo
                          ? `${companyInfo.groupName} / ${companyInfo.name}`
                          : company.companyId || "Empresa sin asignar"}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() =>
                          setPermissionsDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  companyPermissions: current.companyPermissions.filter(
                                    (_, rowIndex) => rowIndex !== index
                                  ),
                                }
                              : current
                          )
                        }
                      >
                        Quitar
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <Select
                        value={company.companyId}
                        onValueChange={(companyId) =>
                          patchPermissionRow(index, (row) => ({
                            ...row,
                            companyId,
                            accounts: buildAccounts(companyId, row.accounts),
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.groupName} / {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={company.status}
                        onValueChange={(value) =>
                          patchPermissionRow(index, (row) => ({
                            ...row,
                            status: value as "active" | "disabled",
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="disabled">Desactivado</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={company.baseRole}
                        onValueChange={(value) =>
                          patchPermissionRow(index, (row) => ({
                            ...row,
                            baseRole: value as "ADMIN" | "VIEWER",
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="VIEWER">VIEWER</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mt-4 space-y-2">
                      {accountOptions.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">
                          Esta empresa no tiene cuentas visibles en el overlay.
                        </div>
                      )}

                      {accountOptions.map((account) => {
                        const current =
                          company.accounts.find((item) => item.accountId === account.accountId) ??
                          account;

                        return (
                          <div key={account.accountId} className="grid gap-3 rounded-xl bg-white px-3 py-3 md:grid-cols-[minmax(0,1fr)_120px_120px]">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-slate-800">
                                {companiesById
                                  .get(company.companyId)
                                  ?.accounts.find((item) => item.id === account.accountId)?.name ??
                                  `Cuenta ${account.accountId.slice(0, 8)}`}
                              </div>
                              <div className="truncate text-xs text-slate-500">{account.accountId}</div>
                            </div>

                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={current.canView}
                                onChange={(event) =>
                                  patchPermissionRow(index, (row) => ({
                                    ...row,
                                    accounts: buildAccounts(row.companyId, row.accounts).map((item) =>
                                      item.accountId === account.accountId
                                        ? {
                                            ...item,
                                            canView: event.target.checked,
                                            canEdit: event.target.checked ? current.canEdit : false,
                                          }
                                        : item
                                    ),
                                  }))
                                }
                              />
                              Ver
                            </label>

                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={current.canEdit}
                                onChange={(event) =>
                                  patchPermissionRow(index, (row) => ({
                                    ...row,
                                    accounts: buildAccounts(row.companyId, row.accounts).map((item) =>
                                      item.accountId === account.accountId
                                        ? {
                                            ...item,
                                            canView: event.target.checked || item.canView,
                                            canEdit: event.target.checked,
                                          }
                                        : item
                                    ),
                                  }))
                                }
                              />
                              Editar
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <Button type="button" variant="outline" onClick={addCompanyPermission}>
                <Building2 className="h-4 w-4" />
                Agregar Empresa
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
