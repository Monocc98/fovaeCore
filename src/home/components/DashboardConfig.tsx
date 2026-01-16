import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useParams, useSearchParams } from "react-router";
import { useFiscalYears } from "@/budget/hooks/useFiscalYears";

export const DashboardConfig = () => {
  const { companyId } = useParams<{
    // groupId?: string;
    companyId?: string;
  }>();

  const [searchParams] = useSearchParams();

  const companyIdParam = searchParams.get("c") ?? undefined;

  const {
    fiscalYears,
    selectedFY,
    setSelectedFY,
    isLoading, // o loadingFY, según lo tengas nombrado en el hook
  } = useFiscalYears(companyId || companyIdParam);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        {/* <CustomBreadcrumb items={breadcrumbItems} /> */}
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
