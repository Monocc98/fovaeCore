import type { Account } from "./account.interface";

export interface Company {
    _id:  string;
    name: string;
    balance: number;
    accounts: Account[];
}