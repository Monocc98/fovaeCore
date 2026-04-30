export type AccountsResponse = { accounts: Account[] };

export type AccountType = "MOVEMENTS" | "INVESTMENT" | "CASH";

export interface FamilyTotals {
    balanceWithFamily?: number;
    balanceWithoutFamily?: number;
    totalWithFamily?: number;
    totalWithoutFamily?: number;
    ingresosWithoutFamily?: number;
    incomeFamily?: number;
    egresosWithFamily?: number;
    egresosWithoutFamily?: number;
    family?: number;
}

export interface Account extends FamilyTotals {
    id:     string;
    name:    string;
    type:    AccountType;
    balance: number;
    ingresos: number;
    egresos: number;
    company?: string;
}
