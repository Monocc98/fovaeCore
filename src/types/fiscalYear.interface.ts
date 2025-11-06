import type { Company } from "./comany.interface";

export interface FiscalYear {
    name:      string;
    company:   Company;
    startDate: Date;
    endDate:   Date;
    id:        string;
}