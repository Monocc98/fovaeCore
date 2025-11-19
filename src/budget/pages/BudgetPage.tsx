import React, { useMemo } from "react";
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

export const BudgetPage: React.FC = () => {
  const { companyId, idAccount } = useParams<{
    companyId: string;
    idAccount: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = (location.state as any)?.backTo as string | undefined;

  // Datos
  const { categories } = useCategories(companyId);
  const {
    fiscalYears,
    selectedFY,
    setSelectedFY,
    activeFY,
    isLoading: fyLoading,
  } = useFiscalYears(companyId);

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
    idAccount,
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

  // UI state
  const { toggle, isExpanded } = useExpandedTree();
  const { editingCell, editValue, setEditValue, startEditing, cancelEditing } =
    useBudgetEditing();

  const isEditingCell = (rowKey: string, month: number) =>
    editingCell?.nodeKey === rowKey && editingCell?.month === month;
  const startEdit = (rowKey: string, month: number, current: number) =>
    startEditing(rowKey, month, current);
  const saveEdit = () => {
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
      navigate(`/company/${companyId}?a=${idAccount}`, { replace: true });
    else navigate(-1);
  };

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
        />
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Instrucciones:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
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
