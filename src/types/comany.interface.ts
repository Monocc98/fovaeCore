import type { Account } from "./account.interface";

export interface Company {
    id:  string;
    name: string;
    balance: number;
    ingresos: number;
    egresos: number;
    accounts: Account[];
}