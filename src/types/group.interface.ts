import type { Company } from "./comany.interface";

export interface Group {
    id:       string;
    name:      string;
    balance: number;
    ingresos: number;
    egresos: number;
    companies: Company[];
}