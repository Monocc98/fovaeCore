import type { Company } from "@/home/types/comany.interface";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
interface Props {
  companies: Company[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getBalanceColor(balance: number): string {
  if (balance > 0) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (balance < 0) return "text-red-600 bg-red-50 border-red-200";
  return "text-amber-600 bg-amber-50 border-amber-200";
}

function getBalanceIcon(balance: number) {
  if (balance > 0) return <TrendingUp className="w-4 h-4" />;
  if (balance < 0) return <TrendingDown className="w-4 h-4" />;
  return <DollarSign className="w-4 h-4" />;
}

export const AccountsCard = ({ companies }: Props) => {
  return (
    <div className="space-y-3">
      {companies.map((company) => (
        <div
          key={company._id}
          className={`flex items-center justify-between p-3 rounded-lg border ${getBalanceColor(
            100
          )}`}
        >
          <div className="flex items-center space-x-3">
            {getBalanceIcon(100)}
            <span className="font-medium text-sm">{company.name}</span>
          </div>
          <span className="font-semibold text-sm">{formatCurrency(100)}</span>
        </div>
      ))}
    </div>
  );
};
