import type { Category } from "./category.interface";

export interface Movement {
    description: string;
    comments:    string;
    company:     string;
    account:     string;
    occurredAt:  Date;
    recordedAt:  Date;
    amount:      number;
    source:      string;
    category:    Category;
    tags:        any[];
    id:          string;
    transferId?: string;
}