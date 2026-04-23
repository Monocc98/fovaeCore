import React from "react";
import { formatCurrency } from "@/helpers";
import type { FiscalYear } from "@/types";

interface Props {
  title: string;
  fiscalYears: FiscalYear[];
  selectedFY: string;
  setSelectedFY: (v: string) => void;
  grandTotal: number;
  onBack: () => void;
  loadingFY?: boolean;
}

export const BudgetHeader: React.FC<Props> = ({
  title,
  fiscalYears,
  selectedFY,
  setSelectedFY,
  grandTotal,
  onBack,
  loadingFY,
}) => (
  <div className="flex items-center justify-between p-6 border-b">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="text-gray-600 mt-1">
        Administra el presupuesto mensual por categoría
      </p>
    </div>
    <div className="flex items-center gap-3">
      <label className="text-sm text-gray-600">Año Fiscal:</label>
      <select
        className="border rounded-lg px-3 py-2 text-sm"
        value={selectedFY}
        onChange={(e) => setSelectedFY(e.target.value)}
        disabled={loadingFY || !fiscalYears.length}
      >
        {fiscalYears.map((fy) => (
          <option key={fy.id} value={fy.id}>
            {fy.name}
          </option>
        ))}
      </select>
      <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
        <span className="text-sm text-slate-800 font-medium">
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
);
