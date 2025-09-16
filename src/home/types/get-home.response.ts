import type { Group } from "./group.interface";
import type { User } from "./user.interface";

export interface HomeResponse {
    user:   User;
    groups: Group[];
}