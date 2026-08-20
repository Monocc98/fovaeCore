import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import type { FiscalYear, FiscalYearResponse } from "@/types";
import {
  getFiscalYearsAllAction,
} from "@/home/actions/fiscalYear.actions";

export const useFiscalYears = (companyId?: string, companyIds?: string[]) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Si companyId es "general", lo tratamos como undefined para cargar todo el grupo
  const effectiveCompanyId = companyId && companyId !== "general" ? companyId : undefined;

  // Consultamos todos los mapeos de la BD de forma global (como antes del primer cambio, garantizando que siempre responda)
  const { data: allLinks = [], isLoading } = useQuery<FiscalYearResponse[]>({
    queryKey: ["fiscalYearsAll"],
    queryFn: getFiscalYearsAllAction,
    staleTime: 1000 * 60 * 10,
  });

  // Filtramos las vinculaciones localmente en el cliente
  const links = useMemo(() => {
    if (effectiveCompanyId) {
      // Si estamos en una empresa específica, mostramos solo sus años fiscales
      return allLinks.filter((link: any) => {
        const cid = String(link.company?.id ?? link.company?._id ?? link.company);
        return cid === String(effectiveCompanyId);
      });
    } else if (companyIds && companyIds.length > 0) {
      // Si estamos en la pestaña general del grupo, mostramos los años de las empresas del grupo
      return allLinks.filter((link: any) => {
        const cid = String(link.company?.id ?? link.company?._id ?? link.company);
        return companyIds.includes(cid);
      });
    }
    // Si estamos en la vista raíz o no se han filtrado empresas, mostramos todos los años fiscales disponibles
    return allLinks;
  }, [allLinks, effectiveCompanyId, companyIds]);

  // Normalizamos a FiscalYear[] deduplicando por ID para el selector
  const fiscalYears = useMemo<FiscalYear[]>(() => {
    const seen = new Set<string>();
    const list: FiscalYear[] = [];
    for (const link of links) {
      const fy = link.fiscalYear;
      if (!fy) continue;
      const id = String(fy.id ?? (fy as any)._id);
      if (seen.has(id)) continue;
      seen.add(id);
      list.push({
        id,
        name: fy.name,
        startDate: new Date(fy.startDate as unknown as string),
        endDate: fy.endDate ? new Date(fy.endDate as unknown as string) : undefined as any,
      });
    }
    return list.sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [links]);

  // Encontrar el año fiscal predeterminado (el en curso que contiene "hoy" o el más reciente)
  const defaultFY = useMemo(() => {
    if (!fiscalYears.length) return "";
    const now = new Date();
    const containingToday = fiscalYears.find((fy) => {
      const start = new Date(fy.startDate);
      const end = fy.endDate
        ? new Date(new Date(fy.endDate).getTime() + 24 * 60 * 60 * 1000)
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
