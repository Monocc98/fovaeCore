const hasTransferRef = (transferRef: unknown): boolean => {
  if (transferRef == null) return false;
  if (typeof transferRef === "string") return transferRef.trim().length > 0;
  if (typeof transferRef === "object") {
    const maybeId = (transferRef as any).id ?? (transferRef as any)._id;
    if (maybeId) return String(maybeId).trim().length > 0;
  }
  return Boolean(transferRef);
};

export const getTransactionColor = (
  amount: number,
  transferRef?: unknown
): string => {
  if (hasTransferRef(transferRef)) return "text-cyan-700";
  if (amount > 0) return "text-green-600";
  if (amount < 0) return "text-red-600";
  return "text-gray-500";
};
