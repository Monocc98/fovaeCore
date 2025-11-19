import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FiscalYear, FiscalYearResponse, FiscalYearsByCompany } from "@/types";
import { getFiscalYearsByIdCompanyAction } from "@/home/actions/fiscalYear.actions";

export const useFiscalYears = (companyId?: string) => {
  const { data, isLoading } = useQuery<FiscalYearResponse[]>({
    queryKey: ["fiscalYears", companyId],
    queryFn: () => getFiscalYearsByIdCompanyAction(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10,
  });

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

  const [selectedFY, setSelectedFY] = useState<string>("");

  useEffect(() => {
    if (fiscalYears.length) setSelectedFY(String(fiscalYears[0].id));
    else setSelectedFY("");
  }, [fiscalYears]);

  const activeFY = useMemo(
    () => fiscalYears.find((f) => f.id === selectedFY) ?? null,
    [fiscalYears, selectedFY]
  );

  return { fiscalYears, selectedFY, setSelectedFY, activeFY, isLoading };
};
