export type AccountsResponse = { accounts: Account[] };

export type AccountType = "MOVEMENTS" | "INVESTMENT" | "CASH";

export interface Account {
    id:     string;
    name:    string;
    type:    AccountType;
    balance: number;
    company?: string;
}