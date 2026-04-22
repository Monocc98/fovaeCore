export type MovementsFilters = {
  q: string;
  type: "ALL" | "INCOME" | "OUTCOME";
  status: "ALL" | "completed" | "pending";
  categoryId?: string;
  subcategoryId?: string;
  subsubcategoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  showTransfers: boolean;
};
