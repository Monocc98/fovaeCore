import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import type { FiscalYear } from "@/types";
import {
  getFiscalYearsByIdCompanyAction,
  getFiscalYearsAction,
} from "@/home/actions/fiscalYear.actions";

export const useFiscalYears = (companyId?: string) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Si companyId está definido, consultamos los de la empresa. Si no, consultamos todos los globales.
  const { data, isLoading } = useQuery({
    queryKey: ["fiscalYears", companyId],
    queryFn: async () => {
      if (companyId) {
        const links = await getFiscalYearsByIdCompanyAction(companyId);
        const list = links.map((link: any) => {
          const fy = link.fiscalYear;
          return {
            id: fy.id ?? fy._id,
            name: fy.name,
            startDate: new Date(fy.startDate as unknown as string),
            endDate: fy.endDate ? new Date(fy.endDate as unknown as string) : undefined,
          } as FiscalYear;
        });
        return { links, fiscalYears: list };
      } else {
        const list = await getFiscalYearsAction();
        const fiscalYears = list.map((fy: any) => ({
          id: fy.id ?? fy._id,
          name: fy.name,
          startDate: new Date(fy.startDate as unknown as string),
          endDate: fy.endDate ? new Date(fy.endDate as unknown as string) : undefined,
        } as FiscalYear));
        return { links: [], fiscalYears };
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  const fiscalYears = useMemo(() => data?.fiscalYears ?? [], [data]);
  const links = useMemo(() => data?.links ?? [], [data]);

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
