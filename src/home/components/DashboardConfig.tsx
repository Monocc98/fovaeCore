import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { useParams, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getHomeAction } from "../actions/get-home.action";
import { buildBreadcrumbFromHome } from "../helpers/buildBreadcrumb.helper";
import { useFiscalYears } from "@/budget/hooks/useFiscalYears";

export const DashboardConfig = () => {
  const { groupId, companyId } = useParams<{
    groupId?: string;
    companyId?: string;
  }>();

  const [searchParams] = useSearchParams();
  const accountId = searchParams.get("a") ?? undefined;
  const companyIdParam = searchParams.get("c") ?? undefined;

  // si ya tienes este query en otro lado con el mismo queryKey,
  // React Query comparte la cache (no duplicas peticiones).
  const { data: home } = useQuery({
    queryKey: ["homeOverlay"],
    queryFn: getHomeAction,
  });

  const breadcrumbItems = buildBreadcrumbFromHome(
    home,
    groupId,
    companyId,
    accountId
  );

  const {
    fiscalYears,
    selectedFY,
    setSelectedFY,
    isLoading, // o loadingFY, según lo tengas nombrado en el hook
  } = useFiscalYears(companyId || companyIdParam);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <CustomBreadcrumb items={breadcrumbItems} />
        {/* Optional: Last updated info */}
        <div className="text-xs text-gray-500">
          Última actualización: {new Date().toLocaleDateString("es-ES")}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Fiscal Year Selector */}
          <div className="flex items-center gap-2">
            <Label
              htmlFor="fiscal-year"
              className="text-sm font-medium text-gray-700"
            >
              Año Fiscal:
            </Label>

            <Select
              value={selectedFY}
              onValueChange={setSelectedFY}
              disabled={isLoading || !fiscalYears.length}
            >
              <SelectTrigger className="w-32" id="fiscal-year">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {fiscalYears.map((fy) => (
                  <SelectItem key={fy.id} value={fy.id}>
                    {fy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Family Switch */}
        <div className="flex items-center gap-2">
          <Label
            htmlFor="family-mode"
            className="text-sm font-medium text-gray-700"
          >
            Family
          </Label>
          <Switch id="family-mode" />
        </div>
      </div>
    </div>
  );
};
