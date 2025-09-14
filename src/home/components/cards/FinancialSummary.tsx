import { useState } from "react";

interface Account {
  name: string;
  balance: number;
  id: string;
}

interface GroupData {
  name: string;
  accounts: Account[];
  totalBalance: number;
  monthlyGrowth: number;
  activeProjects: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

const mockData: Record<string, GroupData> = {
  FOVE: {
    name: "FOVE",
    accounts: [
      { id: "1", name: "FOVAE", balance: 2000000 },
      { id: "2", name: "Del Vin", balance: -1000000 },
      { id: "3", name: "Asignación de Costos", balance: 5000000 },
      { id: "4", name: "DUBAI", balance: -10000 },
    ],
    totalBalance: 5990000,
    monthlyGrowth: 12.5,
    activeProjects: 8,
  },
  "El Castillo": {
    name: "El Castillo",
    accounts: [
      { id: "5", name: "Inmobiliarias", balance: 3500000 },
      { id: "6", name: "Fuerza Patrimonial", balance: 1200000 },
      { id: "7", name: "Desarrollo Norte", balance: 0 },
      { id: "8", name: "Ventas Q4", balance: 850000 },
    ],
    totalBalance: 5550000,
    monthlyGrowth: 8.3,
    activeProjects: 12,
  },
};

export const FinancialSummary = () => {
  const [activeGroup, setActiveGroup] = useState<string>("FOVE");
  const currentData = mockData[activeGroup];
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-700">Balance Total</span>
          <span className="font-bold text-lg text-blue-900">
            {formatCurrency(currentData.totalBalance)}
          </span>
        </div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-green-700">Crecimiento Mensual</span>
          <span className="font-bold text-green-900">
            +{currentData.monthlyGrowth}%
          </span>
        </div>
      </div>
    </div>
  );
};
