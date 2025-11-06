import type { Company } from "./comany.interface";

export interface Group {
    id:       string;
    name:      string;
    balance: number;
    companies: Company[];
}