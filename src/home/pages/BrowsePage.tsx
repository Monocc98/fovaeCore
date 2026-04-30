import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMovementsAction } from "@/home/actions/movements.actions";
import {
  AccountsCard,
  ActionMenu,
  FilterCard,
  FinancialAnalysis,
  FinancialSummary,
  InfoCard,
  MovementsTableCard,
} from "@/home/components/cards";
import { DashboardConfig } from "@/home/components/DashboardConfig";
import type { Account, FamilyTotals } from "@/types/account.interface";
import type { Company } from "@/types/comany.interface";
import type { Category } from "@/types";
import type { MovementsFilters } from "@/types/movements-filters.interface";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  Calculator,
  ClipboardClock,
  Filter,
  Settings,
  TableProperties,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useOverlay } from "../hooks/useOverlay";
import { ImportDataModal } from "../components/modals/ImportDataModal";
import { queryClient } from "@/lib/utils";
import { PendingProcessesCard } from "../components/cards/PendingProcessCard";
import { getBucketsSummaryAction, getBudgetVsActualAction } from "../actions/get-home.action";
import { CategorySummarySkeleton, CategorySummaryTable } from "../components/cards/CategorySummary";
import { getCategoriesOverloadAction } from "../../categories/actions/categories.actions";
import { getTransfersByCompanyAction } from "../actions/transfers.actions";

type Level = "groups" | "companies" | "accounts";
type Tab = FamilyTotals & {
  id: string;
  name: string;
  balance: number;
  ingresos: number;
  egresos: number;
  content?: Company[] | Account[];
};

const getFamilyTotals = (item: FamilyTotals): FamilyTotals => ({
  balanceWithFamily: item.balanceWithFamily,
  balanceWithoutFamily: item.balanceWithoutFamily,
  totalWithFamily: item.totalWithFamily,
  totalWithoutFamily: item.totalWithoutFamily,
  ingresosWithoutFamily: item.ingresosWithoutFamily,
  incomeFamily: item.incomeFamily,
  egresosWithFamily: item.egresosWithFamily,
  egresosWithoutFamily: item.egresosWithoutFamily,
  family: item.family,
});

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
    categoryMode: "include",
    categoryId: undefined,
    subcategoryId: undefined,
    subsubcategoryId: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    minAmount: undefined,
    showTransfers: true,
  });
  const [includeFamily, setIncludeFamily] = useState(true);

  const { data: budgetOverlay } = useQuery({
    queryKey: ["budgetOverlay"],
    queryFn: getBudgetVsActualAction,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: bucketsOverlay, isLoading: isBucketsLoading } = useQuery({
    queryKey: ["homeBucketsSummary"],
    queryFn: getBucketsSummaryAction,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", companyId],
    queryFn: () => getCategoriesOverloadAction(companyId!),
    enabled: !!companyId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const categories = categoriesQuery.data?.company?.categories ?? [];

  // ⬇️ NUEVO: estado para el modal de importación
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importAccount, setImportAccount] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [resumeBatchId, setResumeBatchId] = useState<string | null>(null);

  const tabs = useMemo<Tab[]>(() => {
    if (!overlay) return [];

    if (level === "groups") {
      return overlay.groups.map((g) => ({
        id: g.id ?? (g as any)._id,
        name: g.name,
        balance: g.balance,
        ingresos: g.ingresos,
        egresos: g.egresos,
        content: g.companies,
        ...getFamilyTotals(g),
      }));
    }

    if (level === "companies") {
      const group = overlay.groups.find((g) => g.id === groupId);
      const companies = group?.companies ?? [];
      return companies.map((c) => ({
        id: c.id ?? (c as any)._id,
        name: c.name,
        balance: c.balance,
        ingresos: c.ingresos,
        egresos: c.egresos,
        content: c.accounts,
        ...getFamilyTotals(c),
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
              ingresos: a.ingresos,
              egresos: a.egresos,
              ...getFamilyTotals(a),
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

  const currentSummaryNode = useMemo(() => {
    if (!bucketsOverlay?.groups?.length) return null;

    const id = String(activeId);
    const gid = String(groupId ?? "");

    // nivel grupos: el tab activo es un grupo
    if (level === "groups") {
      const group = bucketsOverlay.groups.find((gr: any) => String(gr._id) === id);
      if (!group) return null;

      return {
        title: `Resumen por Categorías • ${group.name}`,
        summary: group.summary,
        companies: group.companies,
      };
    }

    // nivel companies: estamos dentro de un groupId, y el tab activo es una company
    if (level === "companies") {
      const group = bucketsOverlay.groups.find((gr: any) => String(gr._id) === gid);
      if (!group) return null;

      const company = group.companies.find((co: any) => String(co._id) === id);
      if (!company) return null;

      return {
        title: `Resumen por Categorías • ${company.name}`,
        summary: company.summary,
        companies: [], // en vista empresa, normalmente no quieres breakdown
      };
    }

    return null;
  }, [bucketsOverlay, level, activeId, groupId]);

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

        <DashboardConfig
          includeFamily={includeFamily}
          onIncludeFamilyChange={setIncludeFamily}
        />
        {tabs.map((g) => {

          // ===============================
          // PASO 2: resolver budgetNode
          // ===============================
          const budgetNode = (() => {
            if (!budgetOverlay) return null;

            const getId = (x: any) => String(x?.id ?? x?._id ?? "");

            // Si estamos en nivel GRUPOS
            if (level === "groups") {
              return (
                budgetOverlay.groups?.find(
                  (gr: any) => getId(gr) === String(g.id)
                ) ?? null
              );
            }

            // Si estamos en nivel EMPRESAS
            if (level === "companies") {
              const grp =
                budgetOverlay.groups?.find(
                  (gr: any) => getId(gr) === String(groupId)
                ) ?? null;

              return (
                grp?.companies?.find(
                  (co: any) => getId(co) === String(g.id)
                ) ?? null
              );
            }

            return null;
          })();

          // ===============================
          // RETURN NORMAL
          // ===============================
          return (
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
                        includeFamily={includeFamily}
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
                    <FinancialSummary
                      balance={g.balance ?? 0}
                      income={g.ingresos ?? 0}
                      expenses={g.egresos ?? 0}
                      familyTotals={g}
                      includeFamily={includeFamily}
                    />
                  </InfoCard>
                  {level !== "groups" && (
                    <InfoCard
                      title="Menu Acciones"
                      icon={<Settings className="w-5 h-5 text-gray-400" />}
                    >
                      <ActionMenu
                        mode={level}
                        onImportDataClick={
                          level === "accounts"
                            ? () => {
                              setImportAccount({ id: g.id, name: g.name });
                              setResumeBatchId(null);
                              setIsImportOpen(true);
                            }
                            : undefined
                        }
                      />
                    </InfoCard>
                  )}
                </div>

                {/* Columna central */}
                <div className="col-span-12 lg:col-span-6 space-y-6">
                  {level != "accounts" ? (
                    <>
                      <InfoCard
                        title="Análisis Financiero Mensual"
                        icon={<BarChart3 className="w-5 h-5 text-gray-400" />}
                        description="Comparación mensual y distribución general"
                      >
                        <FinancialAnalysis rows={budgetNode?.budgetVsActual ?? []} />
                      </InfoCard>
                      <InfoCard
                        title={g.id === activeId && currentSummaryNode ? currentSummaryNode.title : "Resumen por Categorias"}
                        icon={<TableProperties className="w-5 h-5 text-gray-400" />}
                        description="Clasificación de ingresos y egresos totales"
                      >
                        {isBucketsLoading ? (
                          <CategorySummarySkeleton />
                        ) : g.id === activeId ? (
                          currentSummaryNode ? (
                            <CategorySummaryTable
                              summary={currentSummaryNode.summary}
                              companies={currentSummaryNode.companies}
                              showCompaniesBreakdown={level === "groups"} // solo en grupos
                              includeFamily={includeFamily}
                            />
                          ) : (
                            <div className="text-sm text-gray-500">No hay datos para mostrar.</div>
                          )
                        ) : null}
                      </InfoCard>
                    </>
                  ) : (
                    // Solo monta el tab ACTIVO para no disparar varias queries
                    g.id === activeId && (
                      <AccountsSection
                        accountId={g.id}
                        filters={filters}
                        onChangeFilters={setFilters}
                        categories={categories}
                        includeFamily={includeFamily}
                      />
                    )
                  )}
                </div>

                {/* Columna derecha */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                  {level != "accounts" ? (
                    <>
                      <InfoCard
                        title="Resumen Financiero"
                        icon={<Calculator className="w-5 h-5 text-gray-400" />}
                      >
                        <FinancialSummary
                          balance={g.balance ?? 0}
                          income={g.ingresos ?? 0}
                          expenses={g.egresos ?? 0}
                          familyTotals={g}
                          includeFamily={includeFamily}
                        />
                      </InfoCard>
                    </>
                  ) : (
                    <>
                      <InfoCard
                        title="Filtros"
                        icon={<Filter className="w-5 h-5 text-gray-400" />}
                      >
                        <FilterCard
                          value={filters}
                          onChange={setFilters}
                          categories={categories}
                        />
                      </InfoCard>
                      <InfoCard
                        title="Procesos Pendientes"
                        icon={
                          <ClipboardClock className="w-5 h-5 text-gray-400" />
                        }
                      >
                        {g.id === activeId && (
                          <PendingProcessesCard
                            accountId={g.id}
                            onProcessClick={(p) => {
                              setImportAccount({ id: g.id, name: g.name });
                              setResumeBatchId(p.id);
                              setIsImportOpen(true);
                            }}
                            onViewAll={() => {
                              // navigate(`/company/${companyId}/imports`) o lo que decidas
                            }}
                          />
                        )}
                      </InfoCard>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
      {level === "accounts" && importAccount && (
        <ImportDataModal
          isOpen={isImportOpen}
          accountId={importAccount.id}
          accountName={importAccount.name}
          resumeBatchId={resumeBatchId}
          onClose={() => {
            setIsImportOpen(false);
            setResumeBatchId(null);
          }}
          onSuccess={async () => {
            setIsImportOpen(false);
            setResumeBatchId(null);

            // refresca movimientos
            await queryClient.invalidateQueries({
              queryKey: ["movementsOverlay", importAccount.id],
            });

            // refresca overlay (tabs / balances)
            await queryClient.invalidateQueries({
              queryKey: ["homeOverlay"],
            });

            await queryClient.invalidateQueries({
              queryKey: ["pendingImportBatches", importAccount.id],
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
  categories,
  includeFamily,
}: {
  accountId: string;
  filters: MovementsFilters;
  onChangeFilters: (f: MovementsFilters) => void;
  categories: Category[];
  includeFamily: boolean;
}) {
  const { companyId } = useParams<{ companyId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["movementsOverlay", accountId],
    queryFn: () => getMovementsAction(accountId),
    enabled: !!accountId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["transfers", companyId],
    queryFn: () => getTransfersByCompanyAction(companyId!),
    enabled: !!companyId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const movements = data?.movements ?? [];

  return (
    <div className="col-span-12 lg:col-span-6 space-y-6">
      <MovementsTableCard
        movements={movements}
        isLoading={isLoading}
        filters={filters}
        onChangeFilters={onChangeFilters}
        accountId={accountId}
        categories={categories}
        transfers={transfers}
        includeFamily={includeFamily}
      />
    </div>
  );
}
