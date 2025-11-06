import type { Category } from "./categories.interfaces";
import type { Company } from "./comany.interface";

export interface CompanyCategories {
    _id:        string;
    name:       string;
    group:      string;
    categories: Category[];
    company: Company;
}

