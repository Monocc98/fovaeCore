import React from "react";
import { ChevronDown, ChevronRight, Edit2, Save, X } from "lucide-react";
import { formatCurrency } from "@/helpers";
import { levelColors } from "../helpers/constants.helper";
import type { CategoryWithBudgets } from "../helpers/buildHierarchy.helper";

interface RowProps {
  node: CategoryWithBudgets;
  level: number;
  rowKey: string;
  isExpanded: boolean;
  toggleRow: (rowKey: string) => void;
  headerMonths: string[];
  monthResolver: (fiscalPos: number) => number;
  isEditing: (month: number) => boolean;
  valueFor: (month: number) => number;
  onStartEdit: (month: number, value: number) => void;
  onSave: () => void;
  onCancel: () => void;
  editValue: string;
  setEditValue: (v: string) => void;
  monthTotalOfChildren: (month: number) => number;
}

export const BudgetRow: React.FC<RowProps> = ({
  node,
  level,
  rowKey,
  isExpanded,
  toggleRow,
  headerMonths,
  monthResolver,
  isEditing,
  valueFor,
  onStartEdit,
  onSave,
  onCancel,
  editValue,
  setEditValue,
  monthTotalOfChildren,
}) => {
  const hasChildren = !!(node.children && node.children.length);
  const isLeaf = node.kind === "SUBSUBCATEGORY";
  const paddingLeft = level * 32;

  return (
    <>
      <tr
        className={`border-b ${
          levelColors[level % 3]
        } transition-all hover:bg-opacity-75`}
      >
        <td
          className="px-4 py-3 sticky left-0 bg-inherit z-10"
          style={{ paddingLeft: paddingLeft + 16 }}
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                onClick={() => toggleRow(rowKey)}
                className="p-1 hover:bg-white rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <span
              className={`font-medium ${
                level === 0 ? "text-lg" : level === 1 ? "text-base" : "text-sm"
              } text-gray-900`}
            >
              {node.name}
            </span>
            {isLeaf && (
              <span className="px-2 py-0.5 text-xs bg-white rounded-full text-gray-600">
                Detalle
              </span>
            )}
          </div>
        </td>

        {headerMonths.map((_, i) => {
          const fiscalPos = i + 1;
          const calMonth = monthResolver(fiscalPos);
          const value = isLeaf ? valueFor(calMonth) : 0;
          const editing = isEditing(calMonth);
          return (
            <td key={calMonth} className="px-2 py-2 text-center">
              {isLeaf ? (
                editing ? (
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onSave();
                        if (e.key === "Escape") onCancel();
                      }}
                      className="w-24 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={onSave}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onCancel}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onStartEdit(calMonth, value)}
                    className="group flex items-center justify-center gap-1 w-full px-2 py-1 hover:bg-white rounded"
                  >
                    <span className="text-sm font-medium">
                      {formatCurrency(value)}
                    </span>
                    <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                  </button>
                )
              ) : (
                <span className="text-sm font-semibold text-gray-700">
                  {formatCurrency(monthTotalOfChildren(calMonth))}
                </span>
              )}
            </td>
          );
        })}

        <td className="px-4 py-3 text-right sticky right-0 bg-inherit z-10">
          <span
            className={`font-bold ${
              level === 0 ? "text-lg" : "text-base"
            } text-gray-900`}
          >
            {formatCurrency(node.total || 0)}
          </span>
        </td>
      </tr>

      {hasChildren &&
        isExpanded &&
        node.children!.map((c) => (
          <React.Fragment key={`${c.kind}:${c._id}`}>
            {/* el render anidado lo hace el padre BudgetTable */}
          </React.Fragment>
        ))}
    </>
  );
};
