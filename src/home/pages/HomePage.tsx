import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHomeAction } from "../actions/get-home.action";

import { InfoCard } from "../components/cards/InfoCard";
import {
  BarChart3,
  Building2,
  Calculator,
  PieChart,
  Settings,
} from "lucide-react";
import { DashboardConfig } from "../components/DashboardConfig";
import { AccountsCard } from "../components/cards/AccountsCard";
import { DistributionCard } from "../components/cards/DistributionCard";
import { ActionMenu } from "../components/cards/ActionMenu";
import { FinancialAnalysis } from "../components/cards/FinancialAnalysis";
import { FinancialSummary } from "../components/cards/FinancialSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const HomePage = () => {
  const { data: homeResponse } = useQuery({
    queryKey: ["homeOverlay"],
    queryFn: () => getHomeAction(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (homeResponse?.groups?.length) {
      setActiveTab(homeResponse.groups[0]._id);
    }
  }, [homeResponse]);

  if (!homeResponse) {
    return <div>Cargando...</div>;
  }

  console.log(homeResponse);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList
        className={"grid w-full max-w-md mx-auto bg-gray-100"}
        style={{
          gridTemplateColumns: `repeat(${homeResponse.groups.length}, minmax(0,1fr))`,
        }}
      >
        {homeResponse?.groups.map((group) => (
          <TabsTrigger
            key={group._id}
            value={group._id}
            onClick={() => setActiveTab(group._id)}
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
          >
            {group.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {homeResponse?.groups.map((group) => (
        <TabsContent key={group._id} value={group._id}>
          <DashboardConfig />
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-6 mt-6">
            {/* Left Column - 2 cards stacked */}
            <div className="col-span-3 space-y-6">
              <InfoCard
                title="Empresas"
                icon={<Building2 className="w-5 h-5 text-gray-400" />}
              >
                <AccountsCard companies={group.companies} />
              </InfoCard>

              <InfoCard
                title="Resumen Financiero"
                icon={<Calculator className="w-5 h-5 text-gray-400" />}
              >
                <FinancialSummary totalBalance={group.totalBalance} />
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
        </TabsContent>
      ))}
    </Tabs>
  );
};
