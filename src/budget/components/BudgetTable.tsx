import React, { useMemo } from "react";
import { formatCurrency } from "@/helpers";
import { BudgetRow } from "./BudgetRow";
import { getMonthTotal, calculateTotals } from "../helpers/totals.helper";
import type { CategoryWithBudgets } from "../helpers/buildHierarchy.helper";

interface Props {
  tree: CategoryWithBudgets[];
  headerMonths: string[];
  monthResolver: (fiscalPos: number) => number;
  isExpanded: (rowKey: string) => boolean;
  toggle: (rowKey: string) => void;
  isEditingCell: (rowKey: string, month: number) => boolean;
  startEdit: (rowKey: string, month: number, v: number) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  editValue: string;
  setEditValue: (v: string) => void;
}

export const BudgetTable: React.FC<Props> = ({
  tree,
  headerMonths,
  monthResolver,
  isExpanded,
  toggle,
  isEditingCell,
  startEdit,
  saveEdit,
  cancelEdit,
  editValue,
  setEditValue,
}) => {
  const grandTotal = useMemo(() => calculateTotals([...tree]), [tree]);

  const render = (node: CategoryWithBudgets, level = 0): React.ReactNode => {
    const rowKey = `${node.kind}:${node._id}`;
    const isEditing = (m: number) => isEditingCell(rowKey, m);
    const valueFor = (m: number) => node.budgets?.[m] || 0;
    const onStartEdit = (m: number, v: number) => startEdit(rowKey, m, v);
    const monthTotalOfChildren = (m: number) =>
      getMonthTotal(node.children || [], m);

    return (
      <React.Fragment key={rowKey}>
        <BudgetRow
          node={node}
          level={level}
          rowKey={rowKey}
          isExpanded={isExpanded(rowKey)}
          toggleRow={toggle}
          headerMonths={headerMonths}
          monthResolver={monthResolver}
          isEditing={isEditing}
          valueFor={valueFor}
          onStartEdit={onStartEdit}
          onSave={saveEdit}
          onCancel={cancelEdit}
          editValue={editValue}
          setEditValue={setEditValue}
          monthTotalOfChildren={monthTotalOfChildren}
        />
        {node.children?.length && isExpanded(rowKey)
          ? node.children.map((c) => render(c, level + 1))
          : null}
      </React.Fragment>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 sticky top-0 z-20">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-100 z-30">
              Categoría
            </th>
            {headerMonths.map((m) => (
              <th
                key={m}
                className="px-2 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[120px]"
              >
                {m}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-100 z-30 min-w-[150px]">
              Total Anual
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">{tree.map((n) => render(n))}</tbody>
        <tfoot className="bg-gray-100 font-bold sticky bottom-0">
          <tr>
            <td className="px-4 py-4 text-left sticky left-0 bg-gray-100 z-30">
              TOTAL GENERAL
            </td>
            {headerMonths.map((_, i) => {
              const calMonth = monthResolver(i + 1);
              return (
                <td
                  key={calMonth}
                  className="px-2 py-4 text-center text-gray-900"
                >
                  {formatCurrency(getMonthTotal(tree, calMonth))}
                </td>
              );
            })}
            <td className="px-4 py-4 text-right sticky right-0 bg-gray-100 z-30">
              <span className="text-lg">{formatCurrency(grandTotal)}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
