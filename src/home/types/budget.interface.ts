import type { Subsubcategory } from "./categories.interfaces";

export interface Budget {
    year:           number;
    month:          number;
    account:        string;
    amount:         number;
    subsubcategory: Subsubcategory;
    id:             string;
}
