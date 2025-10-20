import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Edit2, Save, X } from "lucide-react";
import { formatCurrency } from "@/helpers";
import type {
  Category,
  Subcategory,
  Subsubcategory,
} from "@/home/types/categories.interfaces";
import type { Budget } from "@/home/types/budget.interface";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { getCategoriesOverloadAction } from "@/home/actions/categories.actions";

export interface MonthlyBudget {
  [month: number]: number; // { 1: 1000, 2: 0, ... }
}

export type NodeBase =
  | ({ kind: "CATEGORY" } & Category)
  | ({ kind: "SUBCATEGORY" } & Subcategory)
  | ({ kind: "SUBSUBCATEGORY" } & Subsubcategory);

export type CategoryWithBudgets = NodeBase & {
  budgets: MonthlyBudget;
  children?: CategoryWithBudgets[];
  total?: number;
};

/**
 * =============================
 *  Utilidades
 * =============================
 */
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/**
 * Calcula totales (anual) bottom-up y retorna el total del arreglo
 */
function calculateTotals(nodes: CategoryWithBudgets[]): number {
  let total = 0;
  nodes.forEach((n) => {
    if (n.children && n.children.length) {
      n.total = calculateTotals(n.children);
    } else {
      // hoja: sumar meses
      n.total = Object.values(n.budgets).reduce((acc, v) => acc + v, 0);
    }
    total += n.total || 0;
  });
  return total;
}

/**
 * Suma un mes específico recorriendo el árbol (solo hojas tienen budgets)
 */
function getMonthTotal(nodes: CategoryWithBudgets[], month: number): number {
  let sum = 0;
  for (const n of nodes) {
    if (n.children && n.children.length)
      sum += getMonthTotal(n.children, month);
    else sum += n.budgets[month] || 0;
  }
  return sum;
}

/* ============================
 * Builder ANIDADO (único a usar)
 * ============================ */
function buildHierarchyFromNested(
  categories: Category[] = [],
  budgetsByLeaf: Record<string, MonthlyBudget> = {}
): CategoryWithBudgets[] {
  const toLeaf = (leaf: Subsubcategory): CategoryWithBudgets => ({
    kind: "SUBSUBCATEGORY",
    ...leaf,
    budgets: budgetsByLeaf[leaf._id] || {},
    children: [],
    total: 0,
  });

  const toSub = (sub: Subcategory): CategoryWithBudgets => {
    const children = (sub.subsubcategories ?? []).map(toLeaf);
    return { kind: "SUBCATEGORY", ...sub, budgets: {}, children, total: 0 };
  };

  const toCat = (cat: Category): CategoryWithBudgets => {
    const children = (cat.subcategories ?? []).map(toSub);
    return { kind: "CATEGORY", ...cat, budgets: {}, children, total: 0 };
  };

  return categories.map(toCat);
}

/**
 * =============================
 *  Componente principal
 * =============================
 */
interface Props {
  activeGroup?: string;
  fiscalYear?: number;
  budgets?: Budget[];    // si no tienes server aún, puedes pasar []
  accountId?: string;
  onBack?: () => void;
}

const levelColors = [
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-yellow-50 border-yellow-200",
];

export const BudgetPage = ({
  activeGroup = "Grupo Demo",
  fiscalYear = 2025,
  //budgets: incomingBudgets = [],
  onBack = () => {},
}: Props) => {
  // Estado fuente de verdad de budgets (como si fuera tu DB)
  //const [budgets, setBudgets] = useState<Budget[]>(incomingBudgets);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [editingCell, setEditingCell] = useState<{ nodeKey: string; month: number } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const { companyId, accountId } = useParams<{ companyId: string; accountId?: string }>();

  // 1) Traer categorías anidadas por empresa
const { data: catsResp, isLoading: catsLoading, isError: catsError, error } = useQuery({
  queryKey: ["v2:company-categories", companyId],
  queryFn: () => getCategoriesOverloadAction(companyId!),
  enabled: !!companyId,
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
});

const categories = useMemo(() => catsResp?.company?.categories ?? [], [catsResp]);

 // 2) Construir árbol SIN budgets (budgetsByLeaf = {})
  const tree = useMemo(() => {
    const root = buildHierarchyFromNested(categories, {});
    calculateTotals(root); // todos 0 por ahora
    return root;
  }, [categories]);

  const grandTotal = useMemo(() => calculateTotals([...tree]), [tree]); // recalcula totales (defensivo)

  const toggle = (kind: NodeBase["kind"], id: string) => {
    const key = `${kind}:${id}`;
    const next = new Set(expanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpanded(next);
  };

    const getMonthTotal = (nodes: CategoryWithBudgets[], month: number): number => {
    let sum = 0;
    for (const n of nodes) {
      if (n.children && n.children.length) sum += getMonthTotal(n.children, month);
      else sum += n.budgets[month] || 0; // siempre 0 por ahora
    }
    return sum;
  };

  const startEditing = (
    node: CategoryWithBudgets,
    month: number,
    current: number
  ) => {
    const nodeKey = `${node.kind}:${node._id}`;
    setEditingCell({ nodeKey, month });
    setEditValue(String(current ?? 0));
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const subsubIndex = useMemo(() => {
    const map = new Map<string, Subsubcategory>();
    categories.forEach((c) =>
      c.subcategories?.forEach((s) =>
        s.subsubcategories?.forEach((ss) => map.set(ss._id, ss))
      )
    );
    return map;
  }, [categories]);

  /* const saveBudget = () => {
    if (!editingCell) return;
    const amount = parseFloat(editValue) || 0;
    const [kind, id] = editingCell.nodeKey.split(":");
    if (kind !== "SUBSUBCATEGORY") return; // seguridad: solo hojas

    const month = editingCell.month;

   setBudgets((prev) => {
      // buscamos si existe un registro para esa hoja/mes/año
      const idx = prev.findIndex(
        (b) =>
          b.subsubcategory._id === id &&
          b.month === month &&
          b.year === fiscalYear &&
          b.account === accountId
      );

      if (idx >= 0) {
        // actualizar
        const next = [...prev];
        next[idx] = { ...next[idx], amount };
        return next;
      }
      const subsub = subsubIndex.get(id);
      if (!subsub) return prev;
      return [
        ...prev,
        {
          id: `b-${Date.now()}`,
          subsubcategory: subsub,
          month,
          year: fiscalYear,
          amount,
          account: accountId,
        },
      ];
    });

    cancelEditing();
  }; */

  const renderRow = (node: CategoryWithBudgets, level = 0): React.ReactNode => {
    const hasChildren = !!(node.children && node.children.length);
    const isLeaf = node.kind === "SUBSUBCATEGORY";
    const paddingLeft = level * 32; // px
    const rowKey = `${node.kind}:${node._id}`;
    const isExpanded = expanded.has(rowKey);

    const monthlyTotals = MONTHS.map((_, i) => node.budgets?.[i + 1] || 0);

    return (
      <React.Fragment key={rowKey}>
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
                  onClick={() => toggle(node.kind, node._id)}
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
                  level === 0
                    ? "text-lg"
                    : level === 1
                    ? "text-base"
                    : "text-sm"
                } text-gray-900`}
              >
                {node.name}
              </span>
              {isLeaf ? (
                <span className="px-2 py-0.5 text-xs bg-white rounded-full text-gray-600">
                  Detalle
                </span>
              ) : null}
            </div>
          </td>

          {MONTHS.map((_, monthIndex) => {
            const month = monthIndex + 1;
            const value = isLeaf ? node.budgets?.[month] || 0 : 0;
            const isEditing =
              editingCell?.nodeKey === rowKey && editingCell?.month === month;

            return (
              <td key={month} className="px-2 py-2 text-center">
                {isLeaf ? (
                  isEditing ? (
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          //if (e.key === "Enter") saveBudget();
                          if (e.key === "Escape") cancelEditing();
                        }}
                        className="w-24 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        //onClick={saveBudget}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(node, month, value)}
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
                    {hasChildren && isExpanded
                      ? formatCurrency(
                          monthlyTotals[monthIndex] ||
                            getMonthTotal(node.children || [], month)
                        )
                      : "-"}
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
          node.children!.map((c) => renderRow(c, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="max-w-full m-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Presupuesto {fiscalYear}
            </h2>
            <p className="text-gray-600 mt-1">
              Administra el presupuesto mensual por categoría — {activeGroup}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700 font-medium">
                Total: {formatCurrency(grandTotal)}
              </span>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0 z-20">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-100 z-30">
                  Categoría
                </th>
                {MONTHS.map((m) => (
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
            <tbody className="bg-white">{tree.map((n) => renderRow(n))}</tbody>
            <tfoot className="bg-gray-100 font-bold sticky bottom-0">
              <tr>
                <td className="px-4 py-4 text-left sticky left-0 bg-gray-100 z-30">
                  TOTAL GENERAL
                </td>
                {MONTHS.map((_, i) => (
                  <td key={i} className="px-2 py-4 text-center text-gray-900">
                    {formatCurrency(getMonthTotal(tree, i + 1))}
                  </td>
                ))}
                <td className="px-4 py-4 text-right sticky right-0 bg-gray-100 z-30">
                  <span className="text-lg">{formatCurrency(grandTotal)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
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
}
