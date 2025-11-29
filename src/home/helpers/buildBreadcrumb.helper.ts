// src/home/helpers/buildBreadcrumb.helper.ts
import type { HomeResponse } from "@/types";
import type { CrumbItem } from "@/components/custom/CustomBreadcrumb";

type MaybeId = string | undefined | null;

const normalizeId = (obj: any) => (obj?.id ?? obj?._id ?? "").toString();

export const buildBreadcrumbFromHome = (
  home: HomeResponse | undefined,
  groupId: MaybeId,
  companyId: MaybeId,
  accountId: MaybeId
): CrumbItem[] => {
  const items: CrumbItem[] = [];

  // Siempre el inicio
  items.push({ label: "Inicio", to: "/" });

  if (!home || !home.groups?.length) return items;

  // --------------------------------------------------
  // 1) Resolver group y company aunque NO haya groupId
  // --------------------------------------------------
  let group: any = null;
  let company: any = null;

  if (groupId) {
    // Caso ruta con :groupId
    group = home.groups.find((g) => normalizeId(g) === groupId) ?? null;

    if (group && companyId) {
      company =
        group.companies?.find((c: any) => normalizeId(c) === companyId) ??
        null;
    }
  } else if (companyId) {
    // Caso ruta /company/:companyId (no hay groupId en params)
    for (const g of home.groups) {
      const c = g.companies?.find(
        (c: any) => normalizeId(c) === companyId
      );
      if (c) {
        group = g;
        company = c;
        break;
      }
    }
  }

  // 2) Añadir migaja de grupo si existe
  if (group) {
    items.push({
      label: group.name,
      to: `/group/${normalizeId(group)}`, // ajusta si tu ruta es diferente
    });
  }

  // 3) Añadir migaja de compañía si existe
  if (company) {
    items.push({
      label: company.name,
      to: `/company/${normalizeId(company)}`, // ajusta si tu ruta es diferente
    });
  }

  // -----------------------
  // 4) Resolver account
  // -----------------------
  if (company && accountId) {
    const account =
      company.accounts?.find(
        (a: any) => normalizeId(a) === accountId
      ) ?? null;

    if (account) {
      // última migaja (página actual) sin link
      items.push({
        label: account.name,
      });
    }
  }

  return items;
};
