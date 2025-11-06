export type MovementsFilters = {
  q: string;                                // búsqueda texto (desc/comentario/subsub)
  type: "ALL" | "INCOME" | "OUTCOME";               // ingresos/egresos
  status: "ALL" | "completed" | "pending";  // estado
  dateFrom?: string;                        // ISO yyyy-mm-dd
  dateTo?: string;                          // ISO yyyy-mm-dd
  minAmount?: number;                       // monto mínimo
};