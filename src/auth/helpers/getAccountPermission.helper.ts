export function getAccountPermission(
  permissions: any,
  accountId?: string
): { canView: boolean; canEdit: boolean } {
  if (!permissions || !accountId) {
    return { canView: false, canEdit: false };
  }

  // SUPER_ADMIN: acceso total
  if (permissions.globalRole === "SUPER_ADMIN") {
    return { canView: true, canEdit: true };
  }

  // Buscar dentro de sus permisos por empresa
  for (const cp of permissions.companyPermissions ?? []) {
    const acc = cp.accounts.find((a: any) => a.accountId === accountId);
    if (acc) {
      return {
        canView: acc.canView ?? false,
        canEdit: acc.canEdit ?? false,
      };
    }
  }

  // Si no lo encuentra, no tiene acceso
  return { canView: false, canEdit: false };
}
