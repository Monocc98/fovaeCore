import React, { useState } from "react";
import type { Account, AccountsResponse, AccountType } from "@/types";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAccountAction,
  deleteAccountAction,
  getAccountsAction,
  updateAccountAction,
} from "@/accounts/actions/acounts.actions";
import { CustomFullscreenLoading } from "@/components/custom/CustomFullscreenLoading";
import { AccountsContainer } from "../components/AccountsContainer";
import { AccountsModal } from "../ui/AccountsModal";

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

  const accounts = accountsQuery.data?.accounts ?? [];

  const handleBack = () => {
    navigate(-1);
  };

  // --- Loading / Error desde React Query ---
  if (accountsQuery.isLoading) {
    return <CustomFullscreenLoading />;
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
      <AccountsContainer
        accounts={accounts}
        onCreate={openCreate}
        onBack={handleBack}
        onEdit={openEdit}
        onDelete={onDelete}
      />

      {isModalOpen && (
        <AccountsModal
          editing={!!editing}
          formData={formData}
          onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
          onClose={closeModal}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
};
