import type { Company } from "./comany.interface";

export interface Group {
    _id:       string;
    name:      string;
    companies: Company[];
}