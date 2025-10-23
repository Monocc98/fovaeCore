import React, { useState } from "react";
import { Plus, Edit2, Trash2, Save, X, Building2, Wallet } from "lucide-react";
import type {
  Account,
  AccountsResponse,
  AccountType,
} from "@/home/types/account.interface";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAccountAction,
  deleteAccountAction,
  getAccountsAction,
  updateAccountAction,
} from "@/home/actions/acounts.actions";

const ACCOUNT_TYPES: AccountType[] = ["MOVEMENTS", "INVESTMENT", "CASH"];

export const AccountsPage = () => {
  const { companyId: companyIdFromPath } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("c") ?? companyIdFromPath ?? "";
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  //   const [accounts, setAccounts] = useState<Account[]>([]);
  //   const [loading, setLoading] = useState(true);
  //   const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    type: AccountType;
    balance: number;
  }>({
    name: "",
    type: "MOVEMENTS",
    balance: 0,
  });

  // Cargar cuentas desde tu backend
  const accountsQuery = useQuery<AccountsResponse>({
    queryKey: ["accounts", companyId],
    queryFn: () => getAccountsAction(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // --- Mutations ---
  const createMut = useMutation({
    mutationFn: () =>
      createAccountAction({
        name: formData.name,
        type: formData.type,
        balance: formData.balance,
        company: companyId!,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", companyId] });
      closeModal();
    },
  });

  const updateMut = useMutation({
    mutationFn: () =>
      updateAccountAction(editing!.id, {
        name: formData.name,
        type: formData.type,
        balance: formData.balance,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", companyId] });
      closeModal();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAccountAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", companyId] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: "", type: "MOVEMENTS", balance: 0 });
    setIsModalOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setFormData({ name: a.name, type: a.type, balance: Number(a.balance) });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setFormData({ name: "", type: "MOVEMENTS", balance: 0 });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    if (editing) updateMut.mutate();
    else createMut.mutate();
  };

  const onDelete = (id: string) => {
    if (confirm("¿Eliminar cuenta?")) deleteMut.mutate(id);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CASH":
        return <Wallet className="w-5 h-5 text-green-600" />;
      case "MOVEMENTS":
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case "INVESTMENT":
        return <Building2 className="w-5 h-5 text-orange-600" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "CASH":
        return "bg-green-100 text-green-800";
      case "MOVEMENTS":
        return "bg-blue-100 text-blue-800";
      case "INVESTMENT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const accounts = accountsQuery.data?.accounts ?? [];

  const handleBack = () => {
    navigate(-1);
  };

  // --- Loading / Error desde React Query ---
  if (accountsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando cuentas...</p>
        </div>
      </div>
    );
  }

  if (accountsQuery.isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Error al cargar cuentas
          </h3>
          <p className="text-red-600 mb-4">
            {(accountsQuery.error as any)?.message ?? "Error desconocido"}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto m-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Administración de Cuentas
            </h2>
            <p className="text-gray-600 mt-1">
              Gestiona las cuentas bancarias y de efectivo de tu empresa
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={openCreate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Cuenta</span>
            </button>
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>

        <div className="p-6">
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay cuentas registradas
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza agregando tu primera cuenta
              </p>
              <button
                onClick={openCreate}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Agregar Cuenta</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(account.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {account.name}
                        </h3>
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${getTypeBadgeColor(
                            account.type
                          )}`}
                        >
                          {account.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEdit(account)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => onDelete(account.id)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {editing ? "Editar Cuenta" : "Nueva Cuenta"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Cuenta
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Banco BBVA Empresarial"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cuenta
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as typeof formData.type,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{editing ? "Actualizar" : "Crear"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
