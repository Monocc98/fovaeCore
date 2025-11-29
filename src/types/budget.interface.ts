import type { Subsubcategory } from "./categories.interfaces";

export interface Budget {
    year:           number;
    month:          number;
    company:        string;
    amount:         number;
    subsubcategory: Subsubcategory;
    id:             string;
}
