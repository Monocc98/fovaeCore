
interface Row {
  fiscalPos?: number;
  calMonth?: number;
  year?: number;
  budget: number;
  actual: number;
}

interface Row {
  fiscalPos?: number;
  calMonth?: number;
  year?: number;
  budget: number;
  actual: number;
  budgetWithoutFamily?: number;
  actualWithoutFamily?: number;
  familySpent?: number;
}

interface Props {
  rows: Row[];
  includeFamily?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatPct(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(amount);
}

type Semaforo = "green" | "yellow" | "red" | "neutral";

const semaforoStyles: Record<Semaforo, { text: string; bg: string; border: string; label: string; badge: string }> = {
  green: {
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Bien",
    badge: "bg-emerald-100 text-emerald-800",
  },
  yellow: {
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Cuidado",
    badge: "bg-amber-100 text-amber-800",
  },
  red: {
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Alerta",
    badge: "bg-red-100 text-red-800",
  },
  neutral: {
    text: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
    label: "N/A",
    badge: "bg-slate-100 text-slate-800",
  },
};

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

export const BudgetSummary = ({ rows, includeFamily = true }: Props) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-indexed (1..12)

  // Filtrar para obtener solo los registros hasta el mes actual inclusive
  const currentRows = (rows ?? []).filter((r) => {
    if (!r.year || !r.calMonth) return false;
    return r.year < currentYear || (r.year === currentYear && r.calMonth <= currentMonth);
  });

  const totalBudget = currentRows.reduce(
    (sum, r) => sum + (includeFamily ? (r.budget ?? 0) : (r.budgetWithoutFamily ?? r.budget ?? 0)),
    0
  );
  const totalActual = currentRows.reduce(
    (sum, r) => sum + (includeFamily ? (r.actual ?? 0) : (r.actualWithoutFamily ?? r.actual ?? 0)),
    0
  );
  const difference = totalActual - totalBudget;

  const { semaforo, ratio } = computeSemaforo(totalBudget, totalActual);
  const styles = semaforoStyles[semaforo];

  return (
    <div className="space-y-4">
      {/* Presupuestado */}
      <div className="bg-cyan-50/50 p-4 rounded-lg border border-cyan-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-cyan-800 font-medium">Presupuestado</span>
          <span className="font-bold text-lg text-cyan-950">
            {formatCurrency(totalBudget)}
          </span>
        </div>
      </div>

      {/* Devengado */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700 font-medium">Devengado</span>
          <span className="font-bold text-lg text-slate-900">
            {formatCurrency(totalActual)}
          </span>
        </div>
      </div>

      {/* Diferencia y Cumplimiento */}
      <div className={`${styles.bg} p-4 rounded-lg border ${styles.border}`}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${styles.text}`}>Diferencia</span>
            <span className={`font-bold text-lg ${styles.text}`}>
              {formatCurrency(difference)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-current/20 pt-2 text-xs">
            <span className={styles.text}>Cumplimiento</span>
            <div className="flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 font-semibold ${styles.badge}`}>
                {styles.label}
              </span>
              <span className={`font-bold ${styles.text}`}>
                {ratio !== null ? formatPct(ratio) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
