import type { User } from "./user.interface";


export type GlobalRole = "SUPER_ADMIN" | "STANDARD";
export type BaseRole = "ADMIN" | "VIEWER";

export type AccountPermission = {
    accountId: string;
    canView: boolean;
    canEdit: boolean;
};

export type CompanyPermission = {
    companyId: string;
    baseRole: BaseRole;
    accounts: AccountPermission[];
};

export type Permissions = {
    globalRole: GlobalRole;
    companyPermissions: CompanyPermission[];
};

export interface AuthResponse {
    user:  User;
    token: string;
    permissions: Permissions;
}
