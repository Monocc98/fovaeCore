import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useHomeStore } from "../hooks/useHomeStore";
// import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";

export const DashboardConfig = () => {
  const { mode } = useHomeStore();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        {/* <CustomBreadcrumb /> */}
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
            <Select defaultValue="2024">
              <SelectTrigger className="w-32" id="fiscal-year">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Family Switch */}
        {mode !== "account" && (
          <div className="flex items-center gap-2">
            <Label
              htmlFor="family-mode"
              className="text-sm font-medium text-gray-700"
            >
              Family
            </Label>
            <Switch id="family-mode" />
          </div>
        )}
      </div>
    </div>
  );
};
