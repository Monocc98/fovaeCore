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
    externalConceptKey?: string;
    externalCategoryRaw?: string;
    transferId?: string;
    transfer_id?: string;
    transfer?: unknown;
    transferMovement?: unknown;
    type?: string;
    kind?: string;
    movementType?: string;
}
