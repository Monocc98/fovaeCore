import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { HomePage } from "../pages/HomePage";
import { MovementsPage } from "../pages/MovementsPage";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHomeAction } from "../actions/get-home.action";

import { useHomeStore } from "../hooks/useHomeStore";

export const HomeContainer = () => {
  const { data: homeResponse } = useQuery({
    queryKey: ["homeOverlay"],
    queryFn: () => getHomeAction(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    startHome,
    mode,
    activeGroupId,
    activeCompanyId,
    activeAccountId,
    tabsItems,
    changeTab,
  } = useHomeStore();

  // const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (homeResponse?.groups?.length) {
      if (homeResponse?.groups?.length) startHome(homeResponse);
    }
  }, [homeResponse]);

  if (!tabsItems) return <div>Cargando...</div>;

  const activeTabId =
    (mode === "group"
      ? activeGroupId
      : mode === "company"
      ? activeCompanyId
      : activeAccountId) ?? "";
  return (
    <div className="px-6 py-4">
      <Tabs
        value={activeTabId}
        onValueChange={(value) => changeTab(value)}
        className="w-full"
      >
        <TabsList
          className={"grid w-full max-w-md mx-auto bg-gray-100"}
          style={{
            gridTemplateColumns: `repeat(${tabsItems.length}, minmax(0,1fr))`,
          }}
        >
          {tabsItems.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabsItems.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {mode === "account" ? <MovementsPage /> : <HomePage tab={tab} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
