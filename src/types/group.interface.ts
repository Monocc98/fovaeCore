import type { Company } from "./comany.interface";
import type { FamilyTotals } from "./account.interface";

export interface Group extends FamilyTotals {
    id:       string;
    name:      string;
    balance: number;
    ingresos: number;
    egresos: number;
    companies: Company[];
}
