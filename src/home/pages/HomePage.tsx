import { InfoCard } from "../components/cards/InfoCard";
import {
  BarChart3,
  Building2,
  Calculator,
  PieChart,
  Settings,
  WalletMinimal,
} from "lucide-react";

import { DashboardConfig } from "../components/DashboardConfig";
import { AccountsCard } from "../components/cards/AccountsCard";
import { DistributionCard } from "../components/cards/DistributionCard";
import { ActionMenu } from "../components/cards/ActionMenu";
import { FinancialAnalysis } from "../components/cards/FinancialAnalysis";
import { FinancialSummary } from "../components/cards/FinancialSummary";
import { useHomeStore, type TabsItem } from "../hooks/useHomeStore";

interface Props {
  tab: TabsItem;
}

export const HomePage = ({ tab }: Props) => {
  const { mode } = useHomeStore();

  return (
    <>
      <DashboardConfig />
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Left Column - 2 cards stacked */}
        <div className="col-span-3 space-y-6">
          <InfoCard
            title={mode === "group" ? "Empresas" : "Cuentas"}
            icon={
              mode === "group" ? (
                <Building2 className="w-5 h-5 text-gray-400" />
              ) : (
                <WalletMinimal className="w-5 h-5 text-gray-400" />
              )
            }
          >
            <AccountsCard content={tab.content} />
          </InfoCard>

          <InfoCard
            title="Resumen Financiero"
            icon={<Calculator className="w-5 h-5 text-gray-400" />}
          >
            <FinancialSummary balance={tab.balance} />
          </InfoCard>
        </div>
        {/* Center Column - Large card */}
        <div className="col-span-6 space-y-6">
          <InfoCard
            title="Análisis Financiero Mensual"
            icon={<BarChart3 className="w-5 h-5 text-gray-400" />}
            description="Comparación mensual y distribución general"
          >
            <FinancialAnalysis />
          </InfoCard>
        </div>
        <div className="col-span-3 space-y-6">
          <InfoCard
            title="Distribución"
            icon={<PieChart className="w-5 h-5 text-gray-400" />}
          >
            <DistributionCard />
          </InfoCard>
          <InfoCard
            title="Menú Acciones"
            icon={<Settings className="w-5 h-5 text-gray-400" />}
          >
            <ActionMenu />
          </InfoCard>
        </div>
      </div>
    </>
  );
};
