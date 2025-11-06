import type { Subsubcategory } from "./categories.interfaces";

export interface Movement {
    description: string;
    comments:    string;
    account:     string;
    occurredAt:  Date;
    recordedAt:  Date;
    updatedAt?:   Date;
    amount:      number;
    source:      string;
    subsubcategory:    Subsubcategory;
    tags?:        any[];
    id:          string;
    transferId?: string;
}