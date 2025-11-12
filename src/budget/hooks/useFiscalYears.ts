import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FiscalYear } from "@/types";
import { getFiscalYearsAction } from "@/home/actions/fiscalYear.actions";


export const useFiscalYears = (companyId?: string) => {
const q = useQuery<FiscalYear[]>({
queryKey: ["fiscalYears", companyId],
queryFn: () => getFiscalYearsAction(companyId!),
enabled: !!companyId,
staleTime: 1000 * 60 * 10,
});


const [selectedFY, setSelectedFY] = useState<string>("");


useEffect(() => {
const list = q.data ?? [];
setSelectedFY(list.length ? String(list[0].id) : "");
}, [q.data]);


const activeFY = useMemo(
() => (q.data ?? []).find((f) => f.id === selectedFY) ?? null,
[q.data, selectedFY]
);


return { ...q, fiscalYears: q.data ?? [], selectedFY, setSelectedFY, activeFY } as const;
};