import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from "lucide-react";

const hasTransferRef = (transferRef: unknown): boolean => {
  if (transferRef == null) return false;
  if (typeof transferRef === "string") return transferRef.trim().length > 0;
  if (typeof transferRef === "object") {
    const maybeId = (transferRef as any).id ?? (transferRef as any)._id;
    if (maybeId) return String(maybeId).trim().length > 0;
  }
  return Boolean(transferRef);
};

export const getTransactionIcon = (amount: number, transferRef?: unknown) => {
  if (hasTransferRef(transferRef)) {
    return <ArrowRightLeft className="w-4 h-4 text-cyan-600" />;
  }

  if (amount > 0) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
  if (amount < 0) return <ArrowDownLeft className="w-4 h-4 text-red-600" />;
  return <ArrowUpRight className="w-4 h-4 text-gray-500" />;
};
