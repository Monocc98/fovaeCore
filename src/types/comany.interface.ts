import type { Account, FamilyTotals } from "./account.interface";

export interface Company extends FamilyTotals {
    id:  string;
    name: string;
    balance: number;
    ingresos: number;
    egresos: number;
    accounts: Account[];
}
