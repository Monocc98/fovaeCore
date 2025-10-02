import { Calculator, Filter, Settings } from "lucide-react";
import { ActionMenu } from "../components/cards/ActionMenu";
import { InfoCard } from "../components/cards/InfoCard";
import { DashboardConfig } from "../components/DashboardConfig";
import { FinancialSummary } from "../components/cards/FinancialSummary";
import { FilterCard } from "../components/cards/FilterCard";
import { MovementsTableCard } from "../components/cards/MovementsTableCard";
import { useQuery } from "@tanstack/react-query";
import { getMovementsAction } from "../actions/movements.actions";
import { useHomeStore } from "../hooks/useHomeStore";
import type { MovementsFilters } from "../types/movements-filters.interface";
import { useState } from "react";
export const MovementsPage = () => {
  const { activeAccountId } = useHomeStore();

  const [filters, setFilters] = useState<MovementsFilters>({
    q: "",
    type: "ALL",
    status: "ALL",
    dateFrom: undefined,
    dateTo: undefined,
    minAmount: undefined,
  });

  const { data } = useQuery({
    queryKey: ["movementsOverlay"],
    queryFn: () => getMovementsAction(activeAccountId!),
    enabled: !!activeAccountId, // evita ejecutar si aún no hay account
  });

  const movements = data?.movements ?? [];

  return (
    <>
      <DashboardConfig /> {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Left Column - 2 cards stacked */}
        <div className="col-span-3 space-y-6">
          <InfoCard
            title="Resumen Financiero"
            icon={<Calculator className="w-5 h-5 text-gray-400" />}
          >
            <FinancialSummary balance={data?.balance ?? 0} />
          </InfoCard>

          <InfoCard
            title="Menú Acciones"
            icon={<Settings className="w-5 h-5 text-gray-400" />}
          >
            <ActionMenu />
          </InfoCard>
        </div>
        {/* Center Column - Large card */}
        <div className="col-span-6 space-y-6">
          <MovementsTableCard
            movements={movements}
            filters={filters}
            onChangeFilters={setFilters}
          />
        </div>
        <div className="col-span-3 space-y-6">
          <InfoCard
            title="Filtros"
            icon={<Filter className="w-5 h-5 text-gray-400" />}
          >
            <FilterCard value={filters} onChange={setFilters} />
          </InfoCard>
        </div>
      </div>
    </>
  );
};
