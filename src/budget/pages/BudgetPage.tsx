import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { BudgetHeader } from "../components/BudgetHeader";
import { BudgetTable } from "../components/BudgetTable";
import { useCategories } from "../hooks/useCategories";
import { useFiscalYears } from "../hooks/useFiscalYears";
import { useBudgets } from "../hooks/useBudgets";
import { useBudgetEditing } from "../hooks/useBudgetEditing";
import { useExpandedTree } from "../hooks/useExpandedTree";
import {
  makeFiscalCalendar,
  computeStartYear,
  yearForCalendarMonth,
} from "../helpers/fiscalCalendar.helper";
import { buildHierarchyFromNested } from "../helpers/buildHierarchy.helper";
import { calculateTotals } from "../helpers/totals.helper";
import { useAuthStore } from "@/auth/store/auth.store";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleBudgetLockAction } from "../actions/budget.actions";

export const BudgetPage: React.FC = () => {
  const { groupId, companyId } = useParams<{
    groupId: string;
    companyId: string;
  }>();

  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const location = useLocation();
  const backTo = (location.state as any)?.backTo as string | undefined;

  const { permissions } = useAuthStore();

  const isSuperAdmin = useMemo(() => {
    return permissions?.globalRole === "SUPER_ADMIN";
  }, [permissions]);

  // Datos
  const { categories } = useCategories(companyId);

  const {
    fiscalYears,
    selectedFY,
    setSelectedFY,
    activeFY,
    activeLink,
    isLoading: fyLoading,
  } = useFiscalYears(companyId);

  const budgetLocked = !!activeLink?.budgetLocked;

  const startMonth = useMemo(() => {
    if (!activeFY) return 1;
    const d = new Date(activeFY.startDate);
    return isNaN(d.getTime()) ? 1 : d.getUTCMonth() + 1;
  }, [activeFY]);

  const startYear = useMemo(
    () => computeStartYear(activeFY?.startDate),
    [activeFY]
  );
  const yearForMonth = (calMonth: number) =>
    yearForCalendarMonth(calMonth, startMonth, startYear);
  const { header: FISCAL_HEADER, fiscalPosToCalendar } = useMemo(
    () => makeFiscalCalendar(startMonth),
    [startMonth]
  );

  const { budgetsByLeaf, upsertBudget } = useBudgets(
    companyId,
    startMonth,
    yearForMonth,
    categories
  );
  const tree = useMemo(() => {
    const root = buildHierarchyFromNested(categories, budgetsByLeaf);
    calculateTotals(root);
    return root;
  }, [categories, budgetsByLeaf]);
  const grandTotal = useMemo(() => calculateTotals([...tree]), [tree]);

  const canEditBudget = useMemo(() => {
    if (budgetLocked) return false;

    if (!permissions || !companyId) return false;

    // 1) SUPER_ADMIN puede todo
    if (permissions.globalRole === "SUPER_ADMIN") return true;

    const companyPerm = permissions.companyPermissions?.find(
      (cp) => cp.companyId === companyId
    );
    if (!companyPerm) return false;

    // 2) ADMIN de la empresa puede editar presupuesto
    if (companyPerm.baseRole === "ADMIN") return true;

    // 3) (nuevo) Si tiene al menos una cuenta editable dentro de esta empresa,
    //    también le dejamos editar el presupuesto
    const anyAccountEditable = companyPerm.accounts?.some((a) => a.canEdit);
    if (anyAccountEditable) return true;

    // 4) si no cumple nada, no puede editar
    return false;
  }, [permissions, companyId, budgetLocked]);

  // UI state
  const { toggle, isExpanded } = useExpandedTree();
  const { editingCell, editValue, setEditValue, startEditing, cancelEditing } =
    useBudgetEditing();

  useEffect(() => {
    if (budgetLocked) cancelEditing();
  }, [budgetLocked, cancelEditing]);

  const isEditingCell = (rowKey: string, month: number) =>
    editingCell?.nodeKey === rowKey && editingCell?.month === month;

  const startEdit = (rowKey: string, month: number, current: number) =>
    startEditing(rowKey, month, current);

  const saveEdit = () => {
    if (budgetLocked) return;
    if (!editingCell) return;
    const amount = parseFloat(editValue) || 0;
    const [kind, leafId] = editingCell.nodeKey.split(":");
    if (kind !== "SUBSUBCATEGORY") return;
    upsertBudget.mutate({ leafId, month: editingCell.month, amount });
    cancelEditing();
  };

  const handleBack = () => {
    if (backTo) navigate(backTo, { replace: true });
    else if (companyId)
      navigate(`/group/${groupId}/company/${companyId}`, { replace: true });
    else navigate(-1);
  };

  const lockMut = useMutation({
    mutationFn: (id: string) => toggleBudgetLockAction(id),

    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["fiscalYears", companyId] });

      const prev = queryClient.getQueryData<any>(["fiscalYears", companyId]);

      // optimistic: invierte budgetLocked SOLO en el link que coincide
      queryClient.setQueryData(["fiscalYears", companyId], (old: any[] = []) =>
        old.map((link: any) => {
          const linkId = String(link.id ?? link._id ?? "");
          if (linkId !== String(id)) return link;
          return { ...link, budgetLocked: !Boolean(link.budgetLocked) };
        })
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev)
        queryClient.setQueryData(["fiscalYears", companyId], ctx.prev);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscalYears", companyId] });
    },
  });

  return (
    <div className="max-w-full m-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <BudgetHeader
          title={`Presupuesto ${activeFY?.name ?? ""}`}
          fiscalYears={fiscalYears}
          selectedFY={selectedFY}
          setSelectedFY={setSelectedFY}
          grandTotal={grandTotal}
          onBack={handleBack}
          loadingFY={fyLoading}
        />
        {isSuperAdmin && activeLink && (
          <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">
                Bloquear edición de presupuesto
              </div>
              <div className="text-xs text-gray-600">
                Si está activo, ningún usuario podrá modificar los montos.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">
                {budgetLocked ? "Bloqueado" : "Editable"}
              </span>

              <Switch
                checked={budgetLocked}
                disabled={!activeLink || lockMut.isPending}
                onCheckedChange={() => {
                  if (!activeLink) return;
                  lockMut.mutate(
                    String(activeLink.id ?? (activeLink as any)._id)
                  );
                }}
              />
            </div>
          </div>
        )}

        <BudgetTable
          tree={tree}
          headerMonths={FISCAL_HEADER}
          monthResolver={fiscalPosToCalendar}
          isExpanded={(rk) => isExpanded(rk)}
          toggle={(rk) => toggle(rk)}
          isEditingCell={isEditingCell}
          startEdit={startEdit}
          saveEdit={saveEdit}
          cancelEdit={cancelEditing}
          editValue={editValue}
          setEditValue={setEditValue}
          canEdit={canEditBudget}
        />
      </div>

      <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-4">
        <h3 className="font-semibold text-primary mb-2">Instrucciones:</h3>
        <ul className="text-sm text-primary space-y-1">
          <li>
            • Haz clic en los montos de las categorías de{" "}
            <strong>Detalle</strong> para editarlos.
          </li>
          <li>
            • Los totales de Subcategorías y Categorías se calculan
            automáticamente.
          </li>
          <li>
            • Presiona <kbd className="px-2 py-0.5 bg-white rounded">Enter</kbd>{" "}
            para guardar o{" "}
            <kbd className="px-2 py-0.5 bg-white rounded">Esc</kbd> para
            cancelar.
          </li>
        </ul>
      </div>
    </div>
  );
};
