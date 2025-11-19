import type { Company } from "./comany.interface";

export interface FiscalYearsByCompany {
  fiscalYears_Companies: FiscalYearResponse[];
};

export interface FiscalYearResponse {
    fiscalYear: FiscalYear;
    company:    Company;
    id:         string;
}

export interface FiscalYear {
    name:      string;
    startDate: Date;
    endDate:   Date;
    id:        string;
}