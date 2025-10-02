import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

export const getTransactionIcon = (amount: number, transferId: string = "") => {
  if (transferId === "") {
    if (amount > 0) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (amount < 0) return <ArrowDownLeft className="w-4 h-4 text-red-600" />;
  } else {
    return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
  }
};
