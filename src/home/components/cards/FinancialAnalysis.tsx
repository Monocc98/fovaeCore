// FinancialAnalysis.tsx
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Legend,
  Cell,
} from "recharts";

import type { TooltipProps } from "recharts";

type Row = {
  fiscalPos: number;
  calMonth: number; // 1..12
  year: number;
  budget: number;
  actual: number;
  budgetWithoutFamily?: number;
  actualWithoutFamily?: number;
  familySpent?: number;
};

type Semaforo = "green" | "yellow" | "red" | "neutral";

type ChartRow = {
  month: string;
  budget: number;
  actual: number;
  _semaforo: Semaforo;
  _ratio: number | null; // cumplimiento (actual/budget) con regla de signo
  _diff: number; // actual - budget
};

const monthLabel = (m: number) =>
  ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][m - 1] ??
  `M${m}`;

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const formatPct = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "percent", maximumFractionDigits: 0 }).format(n);

const semaforoColor: Record<Semaforo, string> = {
  green: "#10b981",
  yellow: "#f59e0b",
  red: "#ef4444",
  neutral: "#9ca3af",
};

const semaforoBg: Record<Semaforo, string> = {
  green: "#ecfdf5",
  yellow: "#fffbeb",
  red: "#fef2f2",
  neutral: "#f3f4f6",
};

const semaforoLabel: Record<Semaforo, string> = {
  green: "Bien",
  yellow: "Cuidado",
  red: "Alerta",
  neutral: "N/A",
};

const semaforoIcon: Record<Semaforo, string> = {
  green: "▲",
  yellow: "●",
  red: "▼",
  neutral: "•",
};

/**
 * Regla de semáforo:
 * - Budget > 0:
 *    ratio = actual / budget
 *    < 0.90 -> rojo
 *    0.90..0.99 -> amarillo
 *    >= 1.00 -> verde
 *
 * - Budget < 0 (presupuesto negativo):
 *    "al contrario" => mejor si actual es >= budget (menos negativo o positivo).
 *    ratio = actual / budget (da positivo si ambos negativos)
 *    >= 1.00 -> rojo (más negativo que el presupuesto)
 *    0.90..0.99 -> amarillo (cerca, pero todavía más negativo)
 *    < 0.90 -> verde (menos negativo que el presupuesto)
 *
 * - Budget == 0:
 *    si actual == 0 -> neutral
 *    si actual != 0 -> yellow (hay movimiento sin presupuesto)
 */
function computeSemaforo(budget: number, actual: number): { semaforo: Semaforo; ratio: number | null } {
  const b = Number(budget ?? 0);
  const a = Number(actual ?? 0);

  if (b === 0) {
    if (a === 0) return { semaforo: "neutral", ratio: null };
    return { semaforo: "yellow", ratio: null };
  }

  const ratio = a / b;

  if (b > 0) {
    if (ratio < 0.9) return { semaforo: "red", ratio };
    if (ratio < 1) return { semaforo: "yellow", ratio };
    return { semaforo: "green", ratio };
  }

  // b < 0 (negativo) => invertido
  if (ratio >= 1) return { semaforo: "red", ratio };
  if (ratio >= 0.9) return { semaforo: "yellow", ratio };
  return { semaforo: "green", ratio };
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload as ChartRow | undefined;
  if (!row) return null;

  const actualColor = semaforoColor[row._semaforo];
  const pillBg = semaforoBg[row._semaforo];

  return (
    <div className="rounded-lg border bg-white px-3 py-2 text-sm shadow" style={{ minWidth: 220 }}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="font-medium text-gray-700">{label}</div>

        <div
          className="rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: pillBg, color: actualColor }}
          title="Semáforo (Devengado vs Presupuesto)"
        >
          <span className="mr-1">{semaforoIcon[row._semaforo]}</span>
          {semaforoLabel[row._semaforo]}
        </div>
      </div>

      {/* Devengado pintado por semáforo */}
      <div className="flex items-center justify-between">
        <span style={{ color: actualColor, fontWeight: 700 }}>Devengado</span>
        <span style={{ color: actualColor, fontWeight: 700 }}>{formatCurrency(row.actual)}</span>
      </div>

      {/* Presupuesto fijo */}
      <div className="mt-1 flex items-center justify-between text-cyan-700">
        <span className="font-medium">Presupuesto</span>
        <span className="font-medium">{formatCurrency(row.budget)}</span>
      </div>

      {/* Detalles extra */}
      <div className="mt-2 border-t pt-2 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Diferencia</span>
          <span className="font-medium">{formatCurrency(row._diff)}</span>
        </div>

        <div className="mt-1 flex justify-between">
          <span>Cumplimiento</span>
          <span className="font-medium">
            {row._ratio == null ? "—" : formatPct(row._ratio)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const FinancialAnalysis = ({ rows, includeFamily = true }: { rows: Row[]; includeFamily?: boolean }) => {
  const data: ChartRow[] = (rows ?? [])
    .filter((r) => r?.calMonth && r?.year)
    .map((r) => {
      const budget = Number(includeFamily ? (r.budget ?? 0) : (r.budgetWithoutFamily ?? r.budget ?? 0));
      const actual = Number(includeFamily ? (r.actual ?? 0) : (r.actualWithoutFamily ?? r.actual ?? 0));
      const { semaforo, ratio } = computeSemaforo(budget, actual);

      return {
        month: `${monthLabel(r.calMonth)} ${String(r.year).slice(-2)}`,
        budget,
        actual,
        _semaforo: semaforo,
        _ratio: ratio,
        _diff: actual - budget,
      };
    });

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3">Presupuesto vs Devengado</h4>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap={18} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />

            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} />

            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickFormatter={(v) => {
                const n = Number(v);
                const abs = Math.abs(n);
                if (abs >= 1_000_000) return `${n < 0 ? "-" : ""}$${(abs / 1_000_000).toFixed(1)}M`;
                if (abs >= 1_000) return `${n < 0 ? "-" : ""}$${(abs / 1_000).toFixed(0)}k`;
                return formatCurrency(n);
              }}
            />

            {/* línea base para negativos */}
            <ReferenceLine y={0} stroke="#9ca3af" />

            {/* Tooltip con semáforo */}
            <Tooltip content={<CustomTooltip />} />

            <Legend
              formatter={(value) => (value === "actual" ? "Devengado" : "Presupuesto")}
            />

            {/* ✅ ORDEN: Devengado SIEMPRE a la izquierda */}
            <Bar dataKey="actual" radius={[4, 4, 0, 0]}>
              {data.map((row, idx) => (
                <Cell key={`cell-actual-${idx}`} fill={semaforoColor[row._semaforo]} />
              ))}
            </Bar>
            <Bar dataKey="budget" fill="#0e7490" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mini leyenda de semáforo (opcional) */}
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <span style={{ color: semaforoColor.green, fontWeight: 700 }}>▲</span> Verde: OK
        </span>
        <span className="inline-flex items-center gap-1">
          <span style={{ color: semaforoColor.yellow, fontWeight: 700 }}>●</span> Amarillo: 90–99%
        </span>
        <span className="inline-flex items-center gap-1">
          <span style={{ color: semaforoColor.red, fontWeight: 700 }}>▼</span> Rojo: &lt;90%
        </span>
      </div>
    </div>
  );
};
