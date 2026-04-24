import type { FamilyTotals } from "@/types/account.interface";

interface Props {
  balance?: number;
  income?: number;
  expenses?: number;
  familyTotals?: FamilyTotals | null;
  includeFamily?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export const FinancialSummary = ({
  balance = 0,
  income = 0,
  expenses = 0,
  familyTotals = null,
  includeFamily = true,
}: Props) => {
  const displayBalance = familyTotals
    ? includeFamily
      ? familyTotals.totalWithFamily ?? familyTotals.balanceWithFamily ?? balance
      : familyTotals.totalWithoutFamily ?? familyTotals.balanceWithoutFamily ?? balance - (familyTotals.family ?? 0)
    : balance;

  const displayExpenses = familyTotals
    ? includeFamily
      ? familyTotals.egresosWithFamily ?? expenses
      : familyTotals.egresosWithoutFamily ?? expenses - (familyTotals.family ?? 0)
    : expenses;

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Balance Total</span>
          <span className="font-bold text-lg text-slate-900">
            {formatCurrency(displayBalance)}
          </span>
        </div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-green-700">Ingresos</span>
          <span className="font-bold text-green-900">
            {formatCurrency(income)}
          </span>
        </div>
      </div>
      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-red-700">Egresos</span>
          <span className="font-bold text-red-900">
            {formatCurrency(displayExpenses)}
          </span>
        </div>
      </div>
      {/* <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-green-700">Crecimiento Mensual</span>
          <span className="font-bold text-green-900">+5%</span>
        </div>
      </div> */}
    </div>
  );
};
