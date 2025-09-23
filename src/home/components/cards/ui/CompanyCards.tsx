import { useHomeStore } from "@/home/hooks/useHomeStore";
import type { Account } from "@/home/types/account.interface";
import type { Company } from "@/home/types/comany.interface";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  content: Company | Account;
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

export const CompanyCards = ({ content }: Props) => {
  const { changeLevelUp } = useHomeStore();

  return (
    <div
      key={content._id}
      className={`cursor-pointer flex items-center justify-between p-3 rounded-lg border ${getBalanceColor(
        content.balance
      )}`}
      onClick={() => changeLevelUp(content._id)}
    >
      <div className="flex items-center space-x-3">
        {getBalanceIcon(content.balance)}
        <span className="font-medium text-sm">{content.name}</span>
      </div>
      <span className="font-semibold text-sm">
        {formatCurrency(content.balance)}
      </span>
    </div>
  );
};
