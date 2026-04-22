import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useFiscalYears } from "@/budget/hooks/useFiscalYears";

interface Props {
  includeFamily: boolean;
  onIncludeFamilyChange: (checked: boolean) => void;
}

export const DashboardConfig = ({
  includeFamily,
  onIncludeFamilyChange,
}: Props) => {
  const navigate = useNavigate();
  const { groupId, companyId } = useParams<{
    groupId?: string;
    companyId?: string;
  }>();

  const [searchParams] = useSearchParams();

  const companyIdParam = searchParams.get("c") ?? undefined;
  const showBackButton = Boolean(groupId || companyId);

  const {
    fiscalYears,
    selectedFY,
    setSelectedFY,
    isLoading, // o loadingFY, según lo tengas nombrado en el hook
  } = useFiscalYears(companyId || companyIdParam);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        {showBackButton ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 px-2 text-gray-600 hover:text-gray-900"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </Button>
        ) : (
          <div />
        )}
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

        <div className="flex items-center gap-2">
          <Label
            htmlFor="family-mode"
            className="text-sm font-medium text-gray-700"
          >
            Family
          </Label>
          <Switch
            id="family-mode"
            checked={includeFamily}
            onCheckedChange={onIncludeFamilyChange}
          />
        </div>
      </div>
    </div>
  );
};
