import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMovementsAction } from "@/home/actions/movements.actions";
import {
  AccountsCard,
  ActionMenu,
  DistributionCard,
  FilterCard,
  FinancialAnalysis,
  FinancialSummary,
  InfoCard,
  MovementsTableCard,
} from "@/home/components/cards";
import { DashboardConfig } from "@/home/components/DashboardConfig";
import type { Account } from "@/types/account.interface";
import type { Company } from "@/types/comany.interface";
import type { MovementsFilters } from "@/types/movements-filters.interface";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  Calculator,
  Filter,
  PieChart,
  Settings,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useOverlay } from "../hooks/useOverlay";
import { ImportDataModal } from "../components/modals/ImportDataModal";
import { queryClient } from "@/lib/utils";

type Level = "groups" | "companies" | "accounts";
type Tab = {
  id: string;
  name: string;
  balance: number;
  content?: Company[] | Account[];
};

export const BrowsePage = () => {
  const navigate = useNavigate();
  const overlay = useOverlay();

  const [searchParams, setSearchParams] = useSearchParams();

  const qGroup = searchParams.get("g") ?? undefined; // grupo activo (solo en /v2)
  const qCompany = searchParams.get("c") ?? undefined; // empresa activa (en /v2/group/:groupId)
  const qAccount = searchParams.get("a") ?? undefined; // cuenta activa (en /v2/company/:companyId)

  const { groupId, companyId } = useParams<{
    groupId?: string;
    companyId?: string;
    // accountId?: string;
  }>();

  const level: Level = companyId
    ? "accounts"
    : groupId
    ? "companies"
    : "groups";

  const [filters, setFilters] = useState<MovementsFilters>({
    q: "",
    type: "ALL",
    status: "ALL",
    dateFrom: undefined,
    dateTo: undefined,
    minAmount: undefined,
  });

  // ⬇️ NUEVO: estado para el modal de importación
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importAccount, setImportAccount] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const tabs = useMemo<Tab[]>(() => {
    if (!overlay) return [];

    if (level === "groups") {
      return overlay.groups.map((g) => ({
        id: g.id ?? (g as any)._id,
        name: g.name,
        balance: g.balance,
        content: g.companies,
      }));
    }

    if (level === "companies") {
      const group = overlay.groups.find((g) => g.id === groupId);
      const companies = group?.companies ?? [];
      return companies.map((c) => ({
        id: c.id ?? (c as any)._id,
        name: c.name,
        balance: c.balance,
        content: c.accounts,
      }));
    }

    if (level === "accounts") {
      for (const group of overlay.groups) {
        for (const company of group.companies) {
          if (company.id === companyId) {
            return company.accounts.map((a) => ({
              id: a.id ?? (a as any)._id,
              name: a.name,
              balance: a.balance,
            }));
          }
        }
      }
    }

    return [];
  }, [overlay, level, groupId, companyId]);

  // const firstId = tabs[0]?.id ?? "";

  const activeId = useMemo(() => {
    const asked =
      level === "groups"
        ? qGroup
        : level === "companies"
        ? qCompany
        : level === "accounts"
        ? qAccount
        : undefined;

    if (asked && tabs.some((t) => t.id === asked)) return asked; // si existe el tab pedido
    return tabs[0]?.id ?? ""; // fallback: primero
  }, [level, qGroup, qCompany, qAccount, tabs]);

  const handleTabChange = (nextId: string) => {
    const sp = new URLSearchParams(searchParams);
    if (level === "groups") sp.set("g", nextId);
    if (level === "companies") sp.set("c", nextId);
    if (level === "accounts") sp.set("a", nextId);
    setSearchParams(sp, { replace: true }); // evita ensuciar el historial
  };

  if (!tabs.length)
    return (
      <div className="p-6 text-sm text-gray-500">
        No hay elementos para mostrar.
      </div>
    );

  return (
    <div className="px-6 py-4">
      <Tabs value={activeId} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className="grid w-full max-w-2xl mx-auto bg-gray-100"
          style={{
            gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))`,
          }}
        >
          {tabs.map((g) => (
            <TabsTrigger
              key={g.id}
              value={g.id}
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              {g.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <DashboardConfig />
        {tabs.map((g) => (
          <TabsContent key={g.id} value={g.id}>
            <div className="grid grid-cols-12 gap-6 mt-6">
              <div className="col-span-12 lg:col-span-3 space-y-6">
                {level != "accounts" ? (
                  <InfoCard
                    title={level === "groups" ? "Empresas" : "Cuentas"}
                    icon={<Building2 className="w-5 h-5 text-gray-400" />}
                  >
                    {/* Pasa las empresas del grupo activo */}
                    <AccountsCard
                      content={g.content}
                      onClick={(content: any) => {
                        const targetId = content.id ?? content._id;
                        if (level === "groups") {
                          navigate(
                            `/group/${g.id ?? (g as any)._id}?c=${targetId}`
                          );
                        } else if (level === "companies") {
                          navigate(
                            `/company/${g.id ?? (g as any)._id}?a=${targetId}`
                          );
                        }
                      }}
                    />
                  </InfoCard>
                ) : null}

                <InfoCard
                  title="Resumen Financiero"
                  icon={<Calculator className="w-5 h-5 text-gray-400" />}
                >
                  {/* Balance del grupo (usa 0 si aún no lo calculas) */}
                  <FinancialSummary balance={g.balance ?? 0} />
                </InfoCard>
                <InfoCard
                  title="Menú Acciones"
                  icon={<Settings className="w-5 h-5 text-gray-400" />}
                >
                  <ActionMenu
                    mode={level}
                    onImportDataClick={
                      level === "accounts"
                        ? () => {
                            // g es la cuenta actual en este TabsContent
                            setImportAccount({ id: g.id, name: g.name });
                            setIsImportOpen(true);
                          }
                        : undefined
                    }
                  />
                </InfoCard>
              </div>

              {/* Columna central */}
              <div className="col-span-12 lg:col-span-6 space-y-6">
                {level != "accounts" ? (
                  <InfoCard
                    title="Análisis Financiero Mensual"
                    icon={<BarChart3 className="w-5 h-5 text-gray-400" />}
                    description="Comparación mensual y distribución general"
                  >
                    <FinancialAnalysis />
                  </InfoCard>
                ) : (
                  // Solo monta el tab ACTIVO para no disparar varias queries
                  g.id === activeId && (
                    <AccountsSection
                      accountId={g.id}
                      filters={filters}
                      onChangeFilters={setFilters}
                    />
                  )
                )}
              </div>

              {/* Columna derecha */}
              <div className="col-span-12 lg:col-span-3 space-y-6">
                {level != "accounts" ? (
                  <InfoCard
                    title="Distribución"
                    icon={<PieChart className="w-5 h-5 text-gray-400" />}
                  >
                    <DistributionCard />
                  </InfoCard>
                ) : (
                  <InfoCard
                    title="Filtros"
                    icon={<Filter className="w-5 h-5 text-gray-400" />}
                  >
                    <FilterCard value={filters} onChange={setFilters} />
                  </InfoCard>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
      {level === "accounts" && importAccount && (
        <ImportDataModal
          isOpen={isImportOpen}
          accountId={importAccount.id}
          accountName={importAccount.name}
          onClose={() => setIsImportOpen(false)}
          onSuccess={async () => {
            setIsImportOpen(false);

            // refresca movimientos
            await queryClient.invalidateQueries({
              queryKey: ["movementsOverlay", importAccount.id],
            });

            // refresca overlay (tabs / balances)
            await queryClient.invalidateQueries({
              queryKey: ["homeOverlay"],
            });
          }}
        />
      )}
    </div>
  );
};

function AccountsSection({
  accountId,
  filters,
  onChangeFilters,
}: {
  accountId: string;
  filters: MovementsFilters;
  onChangeFilters: (f: MovementsFilters) => void;
}) {
  const { data } = useQuery({
    queryKey: ["movementsOverlay", accountId],
    queryFn: () => getMovementsAction(accountId),
    enabled: !!accountId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const movements = data?.movements ?? [];

  return (
    <div className="col-span-12 lg:col-span-6 space-y-6">
      <MovementsTableCard
        movements={movements}
        filters={filters}
        onChangeFilters={onChangeFilters}
        accountId={accountId}
      />
    </div>
  );
}
