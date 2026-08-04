import { getExpenseBudgetTreeAction } from "@/home/actions/graphics.actions";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { QueryErrorState } from "@/components/ui/QueryErrorState";

type MonthRow = {
  fiscalPos?: number;
  calMonth?: number;
  year?: number;
  label?: string;
  name?: string;
  month?: number;
  monthName?: string;
  budget?: number;
  actual?: number;
  spent?: number;
  remaining?: number;
};

type RawNode = {
  id?: string;
  _id?: string;
  name?: string;
  type?: string;
  byMonth?: MonthRow[];
  categories?: RawNode[];
  subcategories?: RawNode[];
  subsubcategories?: RawNode[];
  children?: RawNode[];
};

type TreeNode = {
  id: string;
  name: string;
  type: string;
  byMonth: MonthRow[];
  children: TreeNode[];
};

const monthLabel = (m?: number) =>
  ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][
    Number(m ?? 0) - 1
  ] ?? "Mes";

const resolveMonthLabel = (m?: MonthRow, fallbackIndex?: number) => {
  if (!m) return "Mes";

  const explicit =
    m.label ??
    m.name ??
    m.monthName ??
    (typeof m.month === "string" ? m.month : undefined);

  if (explicit && String(explicit).trim()) return String(explicit).trim();

  const monthNum = Number(m.calMonth ?? m.month ?? 0);
  if (monthNum >= 1 && monthNum <= 12) {
    const year = m.year ? ` ${m.year}` : "";
    return `${monthLabel(monthNum)}${year}`;
  }

  if (m.fiscalPos != null) return `Mes ${Number(m.fiscalPos)}`;
  if (fallbackIndex != null) return `Mes ${fallbackIndex + 1}`;
  return "Mes";
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatCurrencyPrecise = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);

const parseNumber = (value: unknown) => Number(value ?? 0) || 0;

const ExpenseObjectiveSkeleton = () => (
  <div className="p-8 animate-pulse">
    <div className="mb-6 flex items-center justify-between">
      <div>
        <div className="h-8 w-72 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-96 rounded bg-gray-100" />
      </div>
      <div className="h-10 w-24 rounded-lg bg-gray-200" />
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-xl border bg-white p-5 shadow-sm lg:col-span-2">
        <div className="mb-5 h-6 w-52 rounded bg-gray-200" />
        <div className="flex h-72 items-end gap-4 rounded-lg bg-gray-50 p-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex flex-1 items-end gap-1">
              <div className="w-full rounded-t bg-rose-100" style={{ height: `${35 + index * 5}%` }} />
              <div className="w-full rounded-t bg-red-100" style={{ height: `${55 - index * 3}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-5 h-6 w-40 rounded bg-gray-200" />
        <div className="space-y-4">
          <div className="h-16 rounded-lg bg-gray-200" />
          <div className="h-16 rounded-lg bg-gray-100" />
          <div className="h-16 rounded-lg bg-gray-100" />
        </div>
      </div>
    </div>
    <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-5 h-10 w-full rounded bg-gray-100" />
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="grid grid-cols-4 gap-4">
            <div className="h-4 rounded bg-gray-200" />
            <div className="h-4 rounded bg-gray-100" />
            <div className="h-4 rounded bg-gray-100" />
            <div className="h-4 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const normalizeNode = (raw: RawNode): TreeNode => {
  const childrenRaw =
    raw.children ?? raw.subcategories ?? raw.subsubcategories ?? raw.categories ?? [];

  return {
    id: String(raw.id ?? raw._id ?? crypto.randomUUID()),
    name: String(raw.name ?? "Sin nombre"),
    type: String(raw.type ?? ""),
    byMonth: Array.isArray(raw.byMonth) ? raw.byMonth : [],
    children: childrenRaw.map(normalizeNode),
  };
};

const monthKey = (m?: MonthRow) =>
  `${String(m?.fiscalPos ?? "")}-${String(m?.year ?? "")}-${String(m?.calMonth ?? m?.month ?? "")}`;

const rowForMonth = (rows: MonthRow[], selected: MonthRow): MonthRow | null => {
  const byExactKey = rows.find((r) => monthKey(r) === monthKey(selected));
  if (byExactKey) return byExactKey;

  const byFiscalPos = rows.find(
    (r) => r.fiscalPos != null && r.fiscalPos === selected.fiscalPos
  );
  if (byFiscalPos) return byFiscalPos;

  const byCalendar = rows.find(
    (r) =>
      (r.calMonth ?? r.month) != null &&
      r.year != null &&
      Number(r.calMonth ?? r.month) === Number(selected.calMonth ?? selected.month) &&
      r.year === selected.year
  );
  return byCalendar ?? null;
};

const aggregateRowsForMonths = (rows: MonthRow[], rangeMonths: MonthRow[]): MonthRow | null => {
  if (!rows.length || !rangeMonths.length) return null;

  let totalBudget = 0;
  let totalSpent = 0;
  let totalRemaining = 0;
  let hasData = false;

  for (const month of rangeMonths) {
    const match = rowForMonth(rows, month);
    if (!match) continue;

    hasData = true;
    const budget = parseNumber(match.budget);
    const spent = parseNumber(match.actual ?? match.spent);
    const remaining = parseNumber(match.remaining ?? budget - spent);

    totalBudget += budget;
    totalSpent += spent;
    totalRemaining += remaining;
  }

  if (!hasData) return null;

  return {
    budget: totalBudget,
    actual: totalSpent,
    spent: totalSpent,
    remaining: totalRemaining,
  };
};

const semaforo = (budget: number, spent: number, remaining: number) => {
  if (remaining < 0) {
    return {
      label: "Excedido",
      dot: "bg-red-500",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
    };
  }

  if (budget === 0 && spent === 0) {
    return {
      label: "Sin movimiento",
      dot: "bg-gray-400",
      text: "text-gray-700",
      badge: "bg-gray-100 text-gray-700",
    };
  }

  if (remaining === 0) {
    return {
      label: "Al limite",
      dot: "bg-amber-500",
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-800",
    };
  }

  const ratio = budget > 0 ? remaining / budget : 0;
  if (ratio <= 0.15) {
    return {
      label: "Casi al limite",
      dot: "bg-amber-500",
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-800",
    };
  }

  return {
    label: "Disponible",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800",
  };
};

export const ExpenseBudgetObjectivePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId, companyId } = useParams<{
    groupId: string;
    companyId: string;
  }>();

  const [searchParams] = useSearchParams();
  const fiscalYearId = searchParams.get("fy") ?? undefined;
  const backTo = (location.state as any)?.backTo as string | undefined;

  const query = useQuery({
    queryKey: ["expenseBudgetTree", companyId, fiscalYearId],
    queryFn: () => getExpenseBudgetTreeAction(companyId!, fiscalYearId),
    enabled: !!companyId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const companyData = useMemo(() => {
    const raw = query.data ?? {};
    return (raw as any).company ?? raw;
  }, [query.data]);

  const months: MonthRow[] = useMemo(
    () => (Array.isArray(companyData?.months) ? companyData.months : []),
    [companyData]
  );

  const [selectedPeriod, setSelectedPeriod] = useState("0");
  const didInitSelectedPeriod = useRef(false);

  const currentMonthIndex = useMemo(() => {
    if (!months.length) return 0;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const exactIndex = months.findIndex((m) => {
      const mMonth = Number(m.calMonth ?? m.month ?? 0);
      const mYear = Number(m.year ?? 0);
      return mMonth === currentMonth && mYear === currentYear;
    });

    if (exactIndex >= 0) return exactIndex;

    const monthOnlyIndex = months.findIndex((m) => {
      const mMonth = Number(m.calMonth ?? m.month ?? 0);
      return mMonth === currentMonth;
    });

    if (monthOnlyIndex >= 0) return monthOnlyIndex;
    return 0;
  }, [months]);

  useEffect(() => {
    if (!months.length) return;
    setSelectedPeriod((prev) => {
      if (!didInitSelectedPeriod.current) {
        didInitSelectedPeriod.current = true;
        return String(currentMonthIndex);
      }
      if (prev === "global") return prev;
      const idx = Number(prev);
      if (Number.isInteger(idx) && idx >= 0 && idx < months.length) return prev;
      return String(currentMonthIndex);
    });
  }, [months, currentMonthIndex]);

  const isGlobal = selectedPeriod === "global";
  const selectedMonthIndex = Number(selectedPeriod);
  const selectedMonth = months[selectedMonthIndex] ?? months[0];
  const globalMonthsRange = useMemo(() => {
    if (!months.length) return [] as MonthRow[];
    const endIndex = Math.min(currentMonthIndex, months.length - 1);
    return months.slice(0, endIndex + 1);
  }, [months, currentMonthIndex]);
  const selectedRange = isGlobal ? globalMonthsRange : selectedMonth ? [selectedMonth] : [];

  const categories = useMemo(() => {
    const rawCategories: RawNode[] = Array.isArray(companyData?.categories)
      ? companyData.categories
      : [];

    return rawCategories
      .filter((c) => {
        const t = String(c.type ?? "").toUpperCase();
        if (!t) return true;
        return (
          t.includes("EGRESO") ||
          t.includes("EXPENSE") ||
          t.includes("VARIABLE") ||
          t.includes("FIXED")
        );
      })
      .map(normalizeNode);
  }, [companyData]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const filteredCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return categories;

    const filterNode = (node: TreeNode): TreeNode | null => {
      const children = node.children
        .map((child) => filterNode(child))
        .filter((child): child is TreeNode => child !== null);
      const matchesSelf =
        node.name.toLowerCase().includes(query) || node.type.toLowerCase().includes(query);

      if (matchesSelf || children.length > 0) {
        return { ...node, children };
      }

      return null;
    };

    return categories
      .map((node) => filterNode(node))
      .filter((node): node is TreeNode => node !== null);
  }, [categories, searchTerm]);

  const visibleCount = useMemo(() => {
    const countNodes = (nodes: TreeNode[]): number =>
      nodes.reduce((total, node) => total + 1 + countNodes(node.children), 0);

    return countNodes(filteredCategories);
  }, [filteredCategories]);

  const summaryByMonth: MonthRow[] = useMemo(
    () => (Array.isArray(companyData?.summaryByMonth) ? companyData.summaryByMonth : []),
    [companyData]
  );

  const selectedSummary = useMemo(() => {
    if (!selectedRange.length) return null;
    if (isGlobal) return aggregateRowsForMonths(summaryByMonth, selectedRange);
    return rowForMonth(summaryByMonth, selectedRange[0]);
  }, [summaryByMonth, selectedRange, isGlobal]);

  const flattenRows = useMemo(() => {
    if (!selectedRange.length) return [] as Array<{ node: TreeNode; depth: number }>;

    const rows: Array<{ node: TreeNode; depth: number }> = [];

    const walk = (nodes: TreeNode[], depth: number) => {
      for (const node of nodes) {
        rows.push({ node, depth });
        const hasChildren = node.children.length > 0;
        const isOpen = expanded[node.id] ?? depth < 2;
        if (hasChildren && isOpen) walk(node.children, depth + 1);
      }
    };

    walk(filteredCategories, 0);
    return rows;
  }, [filteredCategories, expanded, selectedRange]);

  const handleBack = () => {
    if (backTo) navigate(backTo, { replace: true });
    else if (companyId) navigate(`/group/${groupId}?c=${companyId}`, { replace: true });
    else navigate(-1);
  };

  if (query.isLoading) {
    return <ExpenseObjectiveSkeleton />;
  }

  if (query.isError) {
    return (
      <div className="p-8">
        <QueryErrorState
          error={query.error}
          onRetry={() => void query.refetch()}
          title="No se pudo cargar la grafica objetivo"
        />
      </div>
    );
  }

  if (!selectedRange.length) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-600">
          No hay datos de meses para el ano fiscal actual.
        </div>
      </div>
    );
  }

  const monthTitle = isGlobal
    ? `Global (${resolveMonthLabel(selectedRange[0], 0)} - ${resolveMonthLabel(
        selectedRange[selectedRange.length - 1],
        selectedRange.length - 1
      )})`
    : resolveMonthLabel(selectedRange[0], selectedMonthIndex);

  const summaryBudget = parseNumber(selectedSummary?.budget);
  const summarySpent = parseNumber(selectedSummary?.actual ?? selectedSummary?.spent);
  const summaryRemaining = parseNumber(
    selectedSummary?.remaining ?? summaryBudget - summarySpent
  );
  const summaryState = semaforo(summaryBudget, summarySpent, summaryRemaining);
  const chartData = filteredCategories.map((node) => {
    const byMonth = isGlobal
      ? aggregateRowsForMonths(node.byMonth, selectedRange)
      : rowForMonth(node.byMonth, selectedRange[0]);
    const budget = parseNumber(byMonth?.budget);
    const spent = parseNumber(byMonth?.actual ?? byMonth?.spent);
    return {
      name: node.name,
      budget,
      spent,
      remaining: parseNumber(byMonth?.remaining ?? budget - spent),
    };
  });

  return (
    <div className="max-w-full m-5 space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            onClick={handleBack}
          >
            <ChevronLeftIcon />
            Regresar
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Periodo</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="global">Global</option>
              {months.map((m, idx) => {
                const label = resolveMonthLabel(m, idx);
                return (
                  <option key={`${monthKey(m)}-${idx}`} value={String(idx)}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">
            Presupuesto vs Egresos
          </h1>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            FY: {companyData?.fiscalYear?.name ?? "Ano fiscal actual"}
          </span>
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
            Mes: {monthTitle}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${summaryState.badge}`}>
            {summaryState.label}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <SummaryBox title="Presupuesto" value={summaryBudget} tone="blue" />
          <SummaryBox title="Gastado" value={summarySpent} tone="red" />
          <SummaryBox title="Disponible" value={summaryRemaining} tone={summaryRemaining < 0 ? "red" : "green"} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Presupuesto vs gastado por categoria
          </h2>
        </div>
        <div className="h-72 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => {
                  const n = Number(v ?? 0);
                  if (Math.abs(n) >= 1000) return `$${Math.round(n / 1000)}k`;
                  return `$${Math.round(n)}`;
                }}
              />
              <Tooltip
                formatter={(value: number, key: string) => [
                  formatCurrency(Number(value ?? 0)),
                  key === "budget"
                    ? "Presupuesto"
                    : key === "spent"
                      ? "Gastado"
                      : "Disponible",
                ]}
              />
              <Legend
                formatter={(value) =>
                  value === "budget"
                    ? "Presupuesto"
                    : value === "spent"
                      ? "Gastado"
                      : "Disponible"
                }
              />
              <Bar dataKey="budget" fill="#0e7490" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" fill="#dc2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="remaining" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-72 rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <span className="text-xs text-gray-500">{visibleCount} categorias visibles</span>
          </div>
        </div>
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Arbol de categoria {" > "} subcategoria {" > "} detalle (solo egresos)
          </h2>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Concepto</th>
                <th className="px-4 py-3 text-right">Presupuesto</th>
                <th className="px-4 py-3 text-right">Gastado</th>
                <th className="px-4 py-3 text-right">Disponible</th>
                <th className="px-4 py-3 text-center">Semaforo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flattenRows.map(({ node, depth }) => {
                const byMonth = isGlobal
                  ? aggregateRowsForMonths(node.byMonth, selectedRange)
                  : rowForMonth(node.byMonth, selectedRange[0]);
                const budget = parseNumber(byMonth?.budget);
                const spent = parseNumber(byMonth?.actual ?? byMonth?.spent);
                const remaining = parseNumber(byMonth?.remaining ?? budget - spent);
                const status = semaforo(budget, spent, remaining);
                const hasChildren = node.children.length > 0;
                const open = expanded[node.id] ?? depth < 2;

                return (
                  <tr key={node.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${depth * 18}px` }}
                      >
                        {hasChildren ? (
                          <button
                            className="rounded p-0.5 hover:bg-gray-100"
                            onClick={() => toggleExpanded(node.id)}
                          >
                            {open ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        ) : (
                          <span className="w-5" />
                        )}
                        <span className={depth === 0 ? "font-semibold text-gray-900" : "text-gray-700"}>
                          {node.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-cyan-700">
                      {formatCurrencyPrecise(budget)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-700">
                      {formatCurrencyPrecise(spent)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${status.text}`}>
                      {formatCurrencyPrecise(remaining)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium ${status.badge}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {!flattenRows.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm.trim()
                      ? "No hay categorias que coincidan con la busqueda."
                      : "No hay categorias de egresos para mostrar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const SummaryBox = ({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "blue" | "amber" | "red" | "green";
}) => {
  const toneMap = {
    blue: "bg-cyan-50 text-cyan-800",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-800",
    green: "bg-emerald-50 text-emerald-800",
  } as const;

  return (
    <div className={`rounded-lg px-4 py-3 ${toneMap[tone]}`}>
      <div className="text-xs font-medium">{title}</div>
      <div className="mt-1 text-lg font-semibold">{formatCurrencyPrecise(value)}</div>
    </div>
  );
};
