import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import type { FiscalYear, FiscalYearResponse } from "@/types";
import { getFiscalYearsByIdCompanyAction } from "@/home/actions/fiscalYear.actions";

export const useFiscalYears = (companyId?: string) => {
  const { data, isLoading } = useQuery<FiscalYearResponse[]>({
    queryKey: ["fiscalYears", companyId],
    queryFn: () => getFiscalYearsByIdCompanyAction(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10,
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const links = useMemo(() => data ?? [], [data]);

  // ✅ Normalizamos aquí a FiscalYear[] (usando tus tipos)
  const fiscalYears = useMemo<FiscalYear[]>(() => {
    const links = data ?? [];
    return links.map((link) => {
      const fy = link.fiscalYear;
      return {
        id: fy.id,
        name: fy.name,
        // si en tu interfaz FiscalYear usas Date, convierte aquí:
        startDate: new Date(fy.startDate as unknown as string),
        endDate: fy.endDate ? new Date(fy.endDate as unknown as string) : (undefined as any),
      };
    });
  }, [data]);

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
    // link.fiscalYear puede venir populated con {id,...}
    return links.find((l: any) => String(l.fiscalYear?.id ?? l.fiscalYear) === selectedFY) ?? null;
  }, [links, selectedFY]);
  
  return { fiscalYears, selectedFY, setSelectedFY, activeFY, activeLink, isLoading };
};
