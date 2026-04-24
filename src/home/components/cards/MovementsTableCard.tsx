import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  formatDate,
  getTransactionColor,
  getTransactionIcon,
} from "@/helpers";
import { deleteMovementAction } from "@/home/actions/movements.actions";
import type { TransferRecord } from "@/home/actions/transfers.actions";
import type { Movement } from "@/types/movement.interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Edit,
  ListPlus,
  Search,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { DeleteMovementAlert } from "../alerts/DeleteMovementAlert";
import type { MovementsFilters } from "@/types/movements-filters.interface";
import { useAuthStore } from "@/auth/store/auth.store";
import { getAccountPermission } from "@/auth/helpers/getAccountPermission.helper";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Category } from "@/types";

interface Props {
  movements?: Movement[];
  isLoading?: boolean;
  filters: MovementsFilters;
  onChangeFilters: (next: MovementsFilters) => void;
  accountId?: string;
  categories?: Category[];
  transfers?: TransferRecord[];
}

export const MovementsTableCard = ({
  movements = [],
  isLoading = false,
  filters,
  onChangeFilters,
  accountId,
  categories = [],
  transfers = [],
}: Props) => {
  const [movementToDelete, setMovementToDelete] = useState<Movement | null>(
    null
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const location = useLocation();
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const idAccount = searchParams.get("a") || undefined;

  const { permissions } = useAuthStore();
  const { canEdit: canEditThisAccount } = getAccountPermission(
    permissions,
    idAccount
  );

  // ✅ 1) parentRef ANTES del virtualizer
  const parentRef = useRef<HTMLDivElement | null>(null);

  // Normaliza texto
  const normalize = (v: unknown) =>
    String(v ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();

  const getOccurredOn = (movement: any): string => {
    const occurredOn = String(movement?.occurredOn ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) return occurredOn;

    const raw = movement?.occurredAt;
    if (!raw) return "";
    const asString = String(raw);
    if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) return asString;

    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getDateOnly = (value: unknown): string => {
    const raw = String(value ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    if (!raw) return "";

    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";

    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getMovementAccountId = (movement: Movement) =>
    String(
      (movement.account as any)?.id ??
      (movement.account as any)?._id ??
      movement.account ??
      accountId ??
      idAccount ??
      ""
    ).trim();

  const getTransferDate = (transfer: TransferRecord) =>
    getDateOnly(
      transfer.transfer_date ??
      transfer.transferDate ??
      transfer.occurredAt ??
      transfer.created_at ??
      transfer.createdAt
    );

  const getTransferFromId = (transfer: TransferRecord) =>
    String(
      transfer.from_account_id ??
      transfer.fromAccountId ??
      (transfer as any).fromAccount?._id ??
      (transfer as any).fromAccount?.id ??
      (transfer as any).fromAccount ??
      ""
    ).trim();

  const getTransferToId = (transfer: TransferRecord) =>
    String(
      transfer.to_account_id ??
      transfer.toAccountId ??
      (transfer as any).toAccount?._id ??
      (transfer as any).toAccount?.id ??
      (transfer as any).toAccount ??
      ""
    ).trim();

  const matchesTransferRecord = (movement: Movement) => {
    const movementDate = getOccurredOn(movement);
    const movementAccountId = getMovementAccountId(movement);
    const movementAmount = Number(movement.amount);

    if (!movementDate || !Number.isFinite(movementAmount)) return false;

    return transfers.some((transfer) => {
      const transferAmount = Number(transfer.amount);
      if (!Number.isFinite(transferAmount)) return false;
      if (Math.abs(movementAmount) !== Math.abs(transferAmount)) return false;
      if (getTransferDate(transfer) !== movementDate) return false;

      const fromId = getTransferFromId(transfer);
      const toId = getTransferToId(transfer);

      if (!movementAccountId) return true;
      if (movementAmount < 0) return movementAccountId === fromId;
      if (movementAmount > 0) return movementAccountId === toId;

      return movementAccountId === fromId || movementAccountId === toId;
    });
  };

  const getTransferRef = (movement: Movement) =>
    movement.transferId ??
    movement.transfer_id ??
    movement.transfer ??
    movement.transferMovement ??
    (movement as any).transferMovementId ??
    (movement as any).transfer_id;

  const isTransferMovement = (movement: Movement) => {
    const transferRef = getTransferRef(movement);

    if (transferRef != null) {
      if (typeof transferRef === "string") {
        if (transferRef.trim()) return true;
      } else if (typeof transferRef === "object") {
        const transferId =
          (transferRef as any).id ??
          (transferRef as any)._id ??
          (transferRef as any).transferId;
        if (transferId != null && String(transferId).trim()) return true;
      } else if (Boolean(transferRef)) {
        return true;
      }
    }

    const markers = [
      movement.source,
      movement.type,
      movement.kind,
      movement.movementType,
      (movement as any).origin,
      (movement as any).category,
    ].map((value) => normalize(value));

    if (markers.some((value) => value === "transfer" || value === "transferencia")) {
      return true;
    }

    const textMarkers = [
      movement.description,
      movement.comments,
      (movement as any).comment,
      movement.subsubcategory?.name,
    ].map((value) => normalize(value));

    return (
      textMarkers.some((value) =>
        value.includes("transferencia") || value.includes("transfer")
      ) || matchesTransferRecord(movement)
    );
  };

  const queryClient = useQueryClient();

  const deleteMut = useMutation({
    mutationFn: ({ id }: { id: string; accountId: string }) =>
      deleteMovementAction(id),

    onMutate: async ({ id, accountId }) => {
      await queryClient.cancelQueries({
        queryKey: ["movementsOverlay", accountId],
      });

      const prev = queryClient.getQueryData<any>([
        "movementsOverlay",
        accountId,
      ]);

      const next = prev?.movements
        ? {
          ...prev,
          movements: prev.movements.filter(
            (m: any) => (m.id ?? m._id) !== id
          ),
        }
        : Array.isArray(prev)
          ? prev.filter((m: any) => (m.id ?? m._id) !== id)
          : prev;

      queryClient.setQueryData(["movementsOverlay", accountId], next);

      return { prev, accountId };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev)
        queryClient.setQueryData(["movementsOverlay", ctx.accountId], ctx.prev);
    },

    onSettled: async (_data, _err, vars) => {
      await queryClient.invalidateQueries({
        queryKey: ["movementsOverlay", vars.accountId],
      });
      await queryClient.invalidateQueries({ queryKey: ["homeOverlay"] });
      setMovementToDelete(null);
    },
  });

  const setFilter = <K extends keyof MovementsFilters>(
    k: K,
    v: MovementsFilters[K]
  ) => onChangeFilters({ ...filters, [k]: v });

  const deferredQ = useDeferredValue(filters.q);
  const q = normalize(deferredQ);

  const filteredMovements = useMemo(() => {
    let rows = [...movements];

    if (filters.showTransfers === false) {
      rows = rows.filter((m) => !isTransferMovement(m));
    }

    if (q) {
      rows = rows.filter((m) =>
        [m.description, (m as any).comment, m.subsubcategory?.name].some((f) =>
          normalize(f).includes(q)
        )
      );
    }

    if (filters.type !== "ALL") {
      rows = rows.filter((m) =>
        filters.type === "INCOME" ? m.amount > 0 : m.amount < 0
      );
    }

    if (
      filters.categoryId ||
      filters.subcategoryId ||
      filters.subsubcategoryId
    ) {
      const categoryMode = filters.categoryMode ?? "include";
      const categoryIndex = new Map<
        string,
        { categoryId?: string; subcategoryId?: string }
      >();

      categories.forEach((cat) => {
        cat.subcategories?.forEach((sub) => {
          sub.subsubcategories?.forEach((leaf) => {
            categoryIndex.set(leaf._id, {
              categoryId: cat._id,
              subcategoryId: sub._id,
            });
          });
        });
      });

      rows = rows.filter((m) => {
        const leafId =
          (m.subsubcategory as any)?._id ??
          (m.subsubcategory as any)?.id ??
          (m as any).subsubcategoryId ??
          (m as any).subsubcategory ??
          "";

        if (!leafId) return categoryMode === "exclude";

        const indexed = categoryIndex.get(leafId);
        const subcategoryId =
          indexed?.subcategoryId ??
          (m.subsubcategory as any)?.parent?._id ??
          (m.subsubcategory as any)?.parent?.id ??
          (m.subsubcategory as any)?.parent ??
          "";
        const categoryId =
          indexed?.categoryId ??
          (m.subsubcategory as any)?.parent?.parent?._id ??
          (m.subsubcategory as any)?.parent?.parent?.id ??
          (m.subsubcategory as any)?.parent?.parent ??
          "";

        let matches = true;
        if (filters.subsubcategoryId) {
          matches = leafId === filters.subsubcategoryId;
        } else if (filters.subcategoryId) {
          matches = subcategoryId === filters.subcategoryId;
        } else if (filters.categoryId) {
          matches = categoryId === filters.categoryId;
        }

        return categoryMode === "exclude" ? !matches : matches;
      });
    }

    const from = filters.dateFrom;
    const to = filters.dateTo;

    if (from) rows = rows.filter((m) => getOccurredOn(m) >= from);
    if (to) rows = rows.filter((m) => getOccurredOn(m) <= to);

    if (typeof filters.minAmount === "number") {
      rows = rows.filter((m) => Math.abs(m.amount) >= filters.minAmount!);
    }

    rows.sort((a, b) => {
      const da = getOccurredOn(a);
      const db = getOccurredOn(b);
      if (!da && !db) return 0;
      if (!da) return sortDir === "asc" ? -1 : 1;
      if (!db) return sortDir === "asc" ? 1 : -1;
      return sortDir === "asc" ? da.localeCompare(db) : db.localeCompare(da);
    });

    return rows;
  }, [movements, q, filters, sortDir, categories, transfers, accountId, idAccount]);

  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;

    filteredMovements.forEach((m) => {
      if (m.amount >= 0) totalIncome += m.amount;
      else totalExpenses += Math.abs(m.amount);
    });

    return {
      totalIncome,
      totalExpenses,
      total: totalIncome - totalExpenses,
      count: filteredMovements.length,
    };
  }, [filteredMovements]);

  const formatSummaryAmount = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ✅ 2) virtualizer ya ve parentRef correctamente
  const rowVirtualizer = useVirtualizer({
    count: filteredMovements.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // 🔧 sube a 72 (con py-4 suele ser más real)
    overscan: 10,
  });

  const navigate = useNavigate();

  const handleNewMovimiento = () => {
    const backTo = location.pathname + location.search;
    navigate(`/company/${companyId}/movement/new/${idAccount}`, {
      state: { state: { backTo } },
    });
  };

  const handleNewTransfer = () => {
    const backTo = location.pathname + location.search;
    navigate(`/company/${companyId}/transfer/new/${idAccount}`, {
      state: { state: { backTo } },
    });
  };

  const handleEditMovement = (idMovement: string) => {
    const backTo = location.pathname + location.search;
    navigate(`/company/${companyId}/movement/${idMovement}/edit`, {
      state: { state: { backTo } },
    });
  };

  const handleDeleteClick = (movement: Movement) =>
    setMovementToDelete(movement);
  const cancelDelete = () => setMovementToDelete(null);

  const confirmDelete = () => {
    if (!movementToDelete) return;
    const accountId = idAccount!;
    deleteMut.mutate({ id: movementToDelete.id, accountId });
  };

  // ✅ 3) columnas fijas para alinear header + filas
  const COL_DATE = "w-[140px]";
  const COL_DESC = "w-[300px]";
  const COL_AMOUNT = "w-[180px]";
  const COL_ACTIONS = "w-[120px]";

  return (
    <>
      <Card className="h-130 flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="text-lg font-semibold">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Movimientos Financieros
              </h3>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar movimientos..."
                    value={filters.q}
                    onChange={(e) => setFilter("q", e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {canEditThisAccount && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                    className="text-gray-400 cursor-pointer hover:text-primary transition-colors"
                    >
                      <ListPlus className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleNewMovimiento}>
                      Movimiento
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNewTransfer}>
                      Transferencia
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col">
          <div ref={parentRef} className="flex-1 overflow-auto">
            {/* ✅ table-fixed + widths */}
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none ${COL_DATE}`}
                    onClick={() =>
                      setSortDir(sortDir === "asc" ? "desc" : "asc")
                    }
                  >
                    Fecha{" "}
                    <span className="ml-1 text-gray-400">
                      {sortDir === "asc" ? "▲" : "▼"}
                    </span>
                  </th>

                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${COL_DESC}`}
                  >
                    Descripción
                  </th>

                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${COL_AMOUNT}`}
                  >
                    Monto
                  </th>

                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${COL_ACTIONS}`}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse">
                      <td className={`px-4 py-4 ${COL_DATE}`}>
                        <div className="h-4 w-24 rounded bg-gray-200" />
                      </td>
                      <td className={`px-4 py-4 ${COL_DESC}`}>
                        <div className="space-y-2">
                          <div className="h-4 w-48 rounded bg-gray-200" />
                          <div className="h-3 w-32 rounded bg-gray-100" />
                        </div>
                      </td>
                      <td className={`px-4 py-4 ${COL_AMOUNT}`}>
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </td>
                      <td className={`px-4 py-4 ${COL_ACTIONS}`}>
                        <div className="h-4 w-12 rounded bg-gray-100" />
                      </td>
                    </tr>
                  ))
                ) : filteredMovements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No se encontraron movimientos.
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <div
                        style={{
                          height: `${rowVirtualizer.getTotalSize()}px`,
                          position: "relative",
                        }}
                      >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                          const movement = filteredMovements[virtualRow.index];
                          const transferRef = getTransferRef(movement);
                          const isTransfer = isTransferMovement(movement);
                          const detailLabel =
                            movement.subsubcategory?.name ??
                            (isTransfer
                              ? movement.amount < 0
                                ? "Salida por transferencia"
                                : "Entrada por transferencia"
                              : "Sin categoría");

                          return (
                            <div
                              key={movement.id}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                            >
                              {/* ✅ también table-fixed + mismas widths */}
                              <table className="w-full table-fixed">
                                <tbody>
                                  <tr className={`${isTransfer ? "bg-cyan-50/50 hover:bg-cyan-50" : "hover:bg-gray-50"} transition-colors`}>
                                    <td
                                      className={`px-4 py-4 whitespace-nowrap text-sm text-gray-900 ${COL_DATE}`}
                                    >
                                      {formatDate(getOccurredOn(movement) || movement.occurredAt)}
                                    </td>

                                    <td
                                      className={`px-4 py-4 text-sm text-gray-900 ${COL_DESC}`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                                          {getTransactionIcon(
                                            movement.amount,
                                            transferRef
                                          )}
                                        </span>
                                        <div className="min-w-0">
                                          <div className="truncate">
                                            {movement.description}
                                          </div>
                                          <div className="text-xs text-gray-500 truncate">
                                            {detailLabel}
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    <td
                                      className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${COL_AMOUNT}`}
                                    >
                                      <span
                                        className={getTransactionColor(
                                          movement.amount,
                                          transferRef
                                        )}
                                      >
                                        {formatCurrency(movement.amount)}
                                      </span>
                                    </td>

                                    <td
                                      className={`px-4 py-4 whitespace-nowrap text-sm text-gray-500 ${COL_ACTIONS}`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        {canEditThisAccount && (
                                          <>
                                            <button
                                              className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                              onClick={() =>
                                                handleEditMovement(movement.id)
                                              }
                                            >
                                              <Edit className="w-4 h-4" />
                                            </button>

                                            <button
                                              className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                              onClick={() =>
                                                handleDeleteClick(movement)
                                              }
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-linear-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300 px-6 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total Ingresos
                </p>
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-green-500" />
                  <p className="text-lg font-bold text-green-600">
                    +
                    {formatSummaryAmount(summary.totalIncome)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total Egresos
                </p>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                  <p className="text-lg font-bold text-red-600">
                    -
                    {formatSummaryAmount(summary.totalExpenses)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Balance
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {summary.total >= 0 ? "+" : ""}
                  {formatSummaryAmount(summary.total)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Movimientos
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {summary.count}{" "}
                  {summary.count === 1 ? "movimiento" : "movimientos"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {movementToDelete && (
        <DeleteMovementAlert
          movement={movementToDelete}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          isLoading={deleteMut.isPending}
        />
      )}
    </>
  );
};
