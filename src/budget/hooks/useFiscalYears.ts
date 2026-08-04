import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import type { FiscalYear, FiscalYearResponse } from "@/types";
import {
  getFiscalYearsByIdCompanyAction,
  getFiscalYearsByGroupAction,
} from "@/home/actions/fiscalYear.actions";

export const useFiscalYears = (companyId?: string, groupId?: string) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Si companyId está definido, consultamos los de la empresa. Si no, consultamos los del grupo.
  const { data: links = [], isLoading } = useQuery<FiscalYearResponse[]>({
    queryKey: ["fiscalYears", companyId, groupId],
    queryFn: async () => {
      if (companyId) {
        return getFiscalYearsByIdCompanyAction(companyId);
      } else if (groupId) {
        return getFiscalYearsByGroupAction(groupId);
      }
      return [];
    },
    enabled: !!companyId || !!groupId,
    staleTime: 1000 * 60 * 10,
  });

  // Normalizamos aquí a FiscalYear[] deduplicando por ID
  const fiscalYears = useMemo<FiscalYear[]>(() => {
    const seen = new Set<string>();
    const list: FiscalYear[] = [];
    for (const link of links) {
      const fy = link.fiscalYear;
      if (!fy) continue;
      const id = String(fy.id ?? fy._id);
      if (seen.has(id)) continue;
      seen.add(id);
      list.push({
        id,
        name: fy.name,
        startDate: new Date(fy.startDate as unknown as string),
        endDate: fy.endDate ? new Date(fy.endDate as unknown as string) : undefined as any,
      });
    }
    return list;
  }, [links]);

  // Encontrar el año fiscal predeterminado (el en curso que contiene "hoy")
  const defaultFY = useMemo(() => {
    if (!fiscalYears.length) return "";
    const now = new Date();
    const containingToday = fiscalYears.find((fy) => {
      const start = new Date(fy.startDate);
      const end = fy.endDate
        ? new Date(fy.endDate)
        : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
      return start <= now && end > now;
    });
    if (containingToday) return containingToday.id;
    return fiscalYears[0].id;
  }, [fiscalYears]);

  const selectedFY = searchParams.get("fy") ?? defaultFY;

  const setSelectedFY = (id: string) => {
    const sp = new URLSearchParams(searchParams);
    if (id) {
      sp.set("fy", id);
    } else {
      sp.delete("fy");
    }
    setSearchParams(sp, { replace: true });
  };

  const activeFY = useMemo(
    () => fiscalYears.find((f) => f.id === selectedFY) ?? null,
    [fiscalYears, selectedFY]
  );

  const activeLink = useMemo(() => {
    return links.find((l: any) => String(l.fiscalYear?.id ?? l.fiscalYear) === selectedFY) ?? null;
  }, [links, selectedFY]);

  return { fiscalYears, selectedFY, setSelectedFY, activeFY, activeLink, isLoading };
};
