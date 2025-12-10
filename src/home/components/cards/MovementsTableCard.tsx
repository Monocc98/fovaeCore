import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  formatDate,
  getStatusBadge,
  getTransactionColor,
  getTransactionIcon,
} from "@/helpers";
import { deleteMovementAction } from "@/home/actions/movements.actions";
// import { useHomeStore } from "@/home/hooks/useHomeStore";
import type { Movement } from "@/types/movement.interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, ListPlus, Search, Trash2 } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
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

interface Props {
  movements?: Movement[];
  filters: MovementsFilters;
  onChangeFilters: (next: MovementsFilters) => void;
  accountId?: string;
}

export const MovementsTableCard = ({
  movements = [],
  filters,
  onChangeFilters,
}: // accountId,
Props) => {
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

  // Normaliza texto: minúsculas, sin acentos, sin espacios extra
  const normalize = (v: unknown) =>
    String(v ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();

  const queryClient = useQueryClient();

  const deleteMut = useMutation({
    // ahora recibe { id, accountId }
    mutationFn: ({ id }: { id: string; accountId: string }) =>
      deleteMovementAction(id),

    // 🔹 Optimistic update
    onMutate: async ({ id, accountId }) => {
      await queryClient.cancelQueries({
        queryKey: ["movementsOverlay", accountId],
      });

      const prev = queryClient.getQueryData<any>([
        "movementsOverlay",
        accountId,
      ]);

      // Ajusta a la forma real de tu respuesta: { movements: Movement[] } o Movement[]
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

    // 🔹 Si falla, rollback
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["movementsOverlay", ctx.accountId], ctx.prev);
      }
    },

    // 🔹 Al terminar, asegura refetch con clave EXACTA
    onSettled: async (_data, _err, vars) => {
      await queryClient.invalidateQueries({
        queryKey: ["movementsOverlay", vars.accountId],
      });
      // Si el balance cambia, refresca el overlay también
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

  // Filtrar por descripción, comentario y (opcional) sub-subcategoría
  const filteredMovements = useMemo(() => {
    let rows = movements;

    // texto (desc / comment / subsub)
    if (q) {
      rows = rows.filter((m) =>
        [m.description, (m as any).comment, m.subsubcategory?.name].some((f) =>
          normalize(f).includes(q)
        )
      );
    }

    // tipo IN/OUT
    if (filters.type !== "ALL") {
      rows = rows.filter((m) =>
        filters.type === "INCOME" ? m.amount > 0 : m.amount < 0
      );
    }

    // estado (si lo tienes en tu modelo; aquí asumo "completed" / "pending")
    // if (filters.status !== "ALL") {
    //   rows = rows.filter((m) =>
    //     filters.status === "completed"
    //       ? m.status === "completed"
    //       : m.status === "pending"
    //   );
    // }

    // fechas
    const from = filters.dateFrom
      ? new Date(filters.dateFrom + "T00:00:00")
      : undefined;
    const to = filters.dateTo
      ? new Date(filters.dateTo + "T23:59:59")
      : undefined;

    if (from) rows = rows.filter((m) => new Date(m.occurredAt) >= from);
    if (to) rows = rows.filter((m) => new Date(m.occurredAt) <= to);

    // monto mínimo
    if (typeof filters.minAmount === "number") {
      rows = rows.filter((m) => Math.abs(m.amount) >= filters.minAmount!);
    }

    rows = rows.sort((a, b) => {
      const da = new Date(a.occurredAt).getTime();
      const db = new Date(b.occurredAt).getTime();
      return sortDir === "asc" ? da - db : db - da;
    });

    return rows;
  }, [movements, q, filters, sortDir]);

  const navigate = useNavigate();

  const handleNewMovimiento = () => {
    const backTo = location.pathname + location.search;
    navigate(`/company/${companyId}/movement/new/${idAccount}`, {
      state: {
        state: { backTo },
      },
    });
  };

  const handleEditMovement = (idMovement: string) => {
    const backTo = location.pathname + location.search;
    navigate(`/company/${companyId}/movement/${idMovement}/edit`, {
      state: {
        state: { backTo },
      },
    });
  };

  const handleDeleteClick = (movement: Movement) => {
    setMovementToDelete(movement); // abrir modal
  };

  const cancelDelete = () => setMovementToDelete(null);

  const confirmDelete = () => {
    if (!movementToDelete) return;
    const accountId = idAccount!; // el que ya lees del search param "a"
    deleteMut.mutate({ id: movementToDelete.id, accountId });
  };

  return (
    <>
      <Card className="h-[520px] flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="text-lg font-semibold">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Movimientos Financieros
              </h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar movimientos..."
                    value={filters.q}
                    onChange={(e) => setFilter("q", e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              {canEditThisAccount && (
                <ListPlus
                  className="w-5 h-5 text-gray-400 cursor-pointer hover:text-red-800 transition-colors"
                  onClick={handleNewMovimiento}
                />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() =>
                      setSortDir(sortDir === "asc" ? "desc" : "asc")
                    }
                  >
                    Fecha
                    <span className="ml-1 text-gray-400">
                      {sortDir === "asc" ? "▲" : "▼"}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMovements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(movement.occurredAt)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(
                          movement.amount,
                          movement.transferId
                        )}
                        <div className="truncate max-w-xs">
                          {movement.description}
                          <div className="text-xs text-gray-500">
                            {movement.subsubcategory.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={getTransactionColor(
                          movement.amount,
                          movement.transferId
                        )}
                      >
                        {formatCurrency(movement.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge("completed")}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {canEditThisAccount && (
                          <>
                            <button
                              className="p-1 text-green-600 hover:text-green-800 transition-colors"
                              onClick={() => handleEditMovement(movement.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:text-red-800 transition-colors">
                              <Trash2
                                className="w-4 h-4"
                                onClick={() => handleDeleteClick(movement)}
                              />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMovements.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No se encontraron movimientos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
