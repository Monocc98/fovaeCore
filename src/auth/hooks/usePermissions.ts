
import { useAuthStore } from "@/auth/store/auth.store";

export const usePermissions = () => {
  const permissions = useAuthStore((s) => s.permissions);

  const isSuperAdmin = permissions?.globalRole === "SUPER_ADMIN";

  const canEditAccount = (companyId: string, accountId: string) => {
    if (!permissions) return false;
    if (permissions.globalRole === "SUPER_ADMIN") return true;

    const company = permissions.companyPermissions.find(
      (c) => c.companyId === companyId
    );
    if (!company) return false;

    const acc = company.accounts.find((a) => a.accountId === accountId);
    return acc?.canEdit ?? false;
  };

  const canViewAccount = (companyId: string, accountId: string) => {
    if (!permissions) return false;
    if (permissions.globalRole === "SUPER_ADMIN") return true;

    const company = permissions.companyPermissions.find(
      (c) => c.companyId === companyId
    );
    if (!company) return false;

    const acc = company.accounts.find((a) => a.accountId === accountId);
    return acc?.canView ?? false;
  };

  return {
    permissions,
    isSuperAdmin,
    canEditAccount,
    canViewAccount,
  };
};
