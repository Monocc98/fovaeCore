import { getAccountsAction } from "@/accounts/actions/acounts.actions";
import {
    createTransferAction,
    getTransfersByCompanyAction,
    type TransferRecord,
} from "@/home/actions/transfers.actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

type FormData = {
    from_account_id: string;
    to_account_id: string;
    amount: number;
    description: string;
    transfer_date: string;
};

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
    }).format(amount);
}

const today = new Date().toISOString().split("T")[0];

export const TransfersUpsertPage = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    const backTo = (location.state as any)?.state?.backTo as string | null;

    const [isFormVisible, setIsFormVisible] = useState(true);
    const [formData, setFormData] = useState<FormData>({
        from_account_id: "",
        to_account_id: "",
        amount: 0,
        description: "",
        transfer_date: today,
    });

    const accountsQuery = useQuery({
        queryKey: ["accounts", companyId],
        queryFn: () => getAccountsAction(companyId!),
        enabled: !!companyId,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const transfersQuery = useQuery({
        queryKey: ["transfers", companyId],
        queryFn: () => getTransfersByCompanyAction(companyId!),
        select: (data) => (Array.isArray(data) ? data : []),
        enabled: !!companyId,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const accounts = accountsQuery.data?.accounts ?? [];
    const transfers = Array.isArray(transfersQuery.data) ? transfersQuery.data : [];

    const createTransferMut = useMutation({
        mutationFn: createTransferAction,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["transfers", companyId] });
            await queryClient.invalidateQueries({ queryKey: ["homeOverlay"] });
            await queryClient.invalidateQueries({ queryKey: ["accounts", companyId] });
            resetForm();
            setIsFormVisible(false);
        },
        onError: (error: any) => {
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                "Error al crear la transferencia";
            window.alert(msg);
        },
    });

    const resetForm = () => {
        setFormData({
            from_account_id: "",
            to_account_id: "",
            amount: 0,
            description: "",
            transfer_date: today,
        });
    };

    const onBack = () => {
        if (backTo) {
            navigate(backTo, { replace: true });
            return;
        }
        navigate(-1);
    };

    const getAccountName = (accountId: string) => {
        const account = accounts.find((a) => a.id === accountId);
        return account ? account.name : "Desconocida";
    };

    const fromAccount = accounts.find((a) => a.id === formData.from_account_id);
    const toAccount = accounts.find((a) => a.id === formData.to_account_id);

    const isLoading = accountsQuery.isLoading || transfersQuery.isLoading;

    const sortedTransfers = useMemo(() => {
        return transfers
            .filter((t) => {
                const fromId = getFromAccountId(t);
                const toId = getToAccountId(t);
                const amount = Number(t.amount);
                const dateValue = new Date(getTransferDate(t) || "").getTime();
                return (
                    Boolean(t.id) &&
                    Boolean(fromId) &&
                    Boolean(toId) &&
                    Number.isFinite(amount) &&
                    amount > 0 &&
                    Number.isFinite(dateValue)
                );
            })
            .sort((a, b) => {
                const da = new Date(getTransferDate(a) || "").getTime();
                const db = new Date(getTransferDate(b) || "").getTime();
                return db - da;
            });
    }, [transfers]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.from_account_id === formData.to_account_id) {
            window.alert("La cuenta origen y destino no pueden ser la misma");
            return;
        }

        if (formData.amount <= 0) {
            window.alert("El monto debe ser mayor a 0");
            return;
        }

        createTransferMut.mutate({
            fromAccount: formData.from_account_id,
            toAccount: formData.to_account_id,
            amount: formData.amount,
            occurredAt: `${formData.transfer_date}T00:00:00.000Z`,
            description: formData.description,
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Cargando transferencias...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b bg-linear-to-r from-blue-50 to-white">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Transferencias Entre Cuentas
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Mueve dinero entre cuentas de la misma empresa
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsFormVisible(!isFormVisible)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <ArrowRightLeft className="w-5 h-5" />
                            <span>Nueva Transferencia</span>
                        </button>
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Volver
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {isFormVisible && (
                        <div className="bg-linear-to-br from-blue-50 to-white rounded-xl border-2 border-blue-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Nueva Transferencia
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsFormVisible(false);
                                        resetForm();
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-12 gap-6">
                                    <div className="col-span-8 space-y-6">
                                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                                Detalles de la Transferencia
                                            </h4>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Cuenta Origen
                                                        </label>
                                                        <select
                                                            value={formData.from_account_id}
                                                            onChange={(e) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    from_account_id: e.target.value,
                                                                    to_account_id:
                                                                        formData.to_account_id === e.target.value
                                                                            ? ""
                                                                            : formData.to_account_id,
                                                                })
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            required
                                                        >
                                                            <option value="">Seleccionar cuenta...</option>
                                                            {accounts.map((account) => (
                                                                <option
                                                                    key={account.id}
                                                                    value={account.id}
                                                                    disabled={account.id === formData.to_account_id}
                                                                >
                                                                    {account.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Cuenta Destino
                                                        </label>
                                                        <select
                                                            value={formData.to_account_id}
                                                            onChange={(e) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    to_account_id: e.target.value,
                                                                    from_account_id:
                                                                        formData.from_account_id === e.target.value
                                                                            ? ""
                                                                            : formData.from_account_id,
                                                                })
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            required
                                                        >
                                                            <option value="">Seleccionar cuenta...</option>
                                                            {accounts.map((account) => (
                                                                <option
                                                                    key={account.id}
                                                                    value={account.id}
                                                                    disabled={account.id === formData.from_account_id}
                                                                >
                                                                    {account.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Monto a Transferir
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                                                $
                                                            </span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={formData.amount || ""}
                                                                onChange={(e) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        amount: Number(e.target.value) || 0,
                                                                    })
                                                                }
                                                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                placeholder="0.00"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Fecha de Transferencia
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={formData.transfer_date}
                                                            onChange={(e) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    transfer_date: e.target.value,
                                                                })
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Descripcion / Concepto
                                                    </label>
                                                    <textarea
                                                        value={formData.description}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                description: e.target.value,
                                                            })
                                                        }
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                        rows={3}
                                                        placeholder="Describe el motivo de la transferencia..."
                                                        required
                                                    />
                                                </div>

                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-4 space-y-4">
                                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                                Vista Previa
                                            </h4>

                                            <div className="space-y-4">
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <div className="text-center mb-3">
                                                        <ArrowRightLeft className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                                        <p className="text-2xl font-bold text-blue-600">
                                                            {formatCurrency(formData.amount)}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Desde:</span>
                                                            <span className="font-medium text-gray-900 text-right ml-2">
                                                                {fromAccount ? fromAccount.name : "No seleccionada"}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-center">
                                                            <div className="w-px h-4 bg-gray-300" />
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Hacia:</span>
                                                            <span className="font-medium text-gray-900 text-right ml-2">
                                                                {toAccount ? toAccount.name : "No seleccionada"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={
                                                createTransferMut.isPending ||
                                                !formData.from_account_id ||
                                                !formData.to_account_id ||
                                                formData.amount <= 0
                                            }
                                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                                        >
                                            <Save className="w-5 h-5" />
                                            <span>Ejecutar Transferencia</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Historial de Transferencias
                        </h3>

                        {sortedTransfers.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                                <ArrowRightLeft className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h4 className="text-lg font-medium text-gray-900 mb-2">
                                    No hay transferencias registradas
                                </h4>
                                <p className="text-gray-600">
                                    Las transferencias entre cuentas apareceran aqui
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                                    Fecha
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                                    Cuenta Origen
                                                </th>
                                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700" />
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                                    Cuenta Destino
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                                    Descripcion
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                                                    Monto
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {sortedTransfers.map((transfer) => {
                                                const fromId = getFromAccountId(transfer);
                                                const toId = getToAccountId(transfer);
                                                const amount = Number(transfer.amount) || 0;

                                                return (
                                                    <tr
                                                        key={transfer.id}
                                                        className="hover:bg-gray-50 transition-colors"
                                                    >
                                                        <td className="px-6 py-4 text-sm text-gray-900">
                                                            {formatTransferDate(getTransferDate(transfer))}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                            {getAccountName(fromId)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <ArrowRightLeft className="w-4 h-4 text-blue-600 mx-auto" />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                            {getAccountName(toId)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            {transfer.description || "-"}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-sm font-semibold text-blue-600">
                                                                {formatCurrency(amount)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const getFromAccountId = (transfer: TransferRecord): string =>
    String(
        transfer.from_account_id ??
        transfer.fromAccountId ??
        (transfer as any).fromAccount?._id ??
        (transfer as any).fromAccount?.id ??
        ""
    );

const getToAccountId = (transfer: TransferRecord): string =>
    String(
        transfer.to_account_id ??
        transfer.toAccountId ??
        (transfer as any).toAccount?._id ??
        (transfer as any).toAccount?.id ??
        ""
    );

const getTransferDate = (transfer: TransferRecord): string =>
    String(
        transfer.transfer_date ??
        transfer.transferDate ??
        transfer.created_at ??
        transfer.createdAt ??
        ""
    );

const formatTransferDate = (raw: string): string => {
    const t = new Date(raw).getTime();
    if (!Number.isFinite(t)) return "-";
    return new Date(raw).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};
