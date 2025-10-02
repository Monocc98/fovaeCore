import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, X } from "lucide-react";
import type { MovementsFilters } from "@/home/types/movements-filters.interface";

interface Props {
  value: MovementsFilters;
  onChange: (next: MovementsFilters) => void;
}

export const FilterCard = ({ value, onChange }: Props) => {
  const set = <K extends keyof MovementsFilters>(
    k: K,
    v: MovementsFilters[K]
  ) => onChange({ ...value, [k]: v });

  const reset = () =>
    onChange({
      q: "",
      type: "ALL",
      status: "ALL",
      dateFrom: undefined,
      dateTo: undefined,
      minAmount: undefined,
    });

  return (
    <>
      <div>
        <Label htmlFor="date-start" className="text-sm font-medium">
          Fecha Inicio
        </Label>
        <Input
          id="date-start"
          type="date"
          value={value.dateFrom ?? ""}
          onChange={(e) => set("dateFrom", e.target.value || undefined)}
        />
      </div>

      <div>
        <Label htmlFor="date-end" className="text-sm font-medium">
          Fecha Fin
        </Label>
        <Input
          id="date-end"
          type="date"
          value={value.dateTo ?? ""}
          onChange={(e) => set("dateTo", e.target.value || undefined)}
        />
      </div>
      <div>
        <Label htmlFor="type-filter" className="text-sm font-medium">
          Tipo
        </Label>
        <Select
          value={value.type}
          onValueChange={(v) => set("type", v as MovementsFilters["type"])}
        >
          <SelectTrigger id="type-filter">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            <SelectItem value="INCOME">Ingresos</SelectItem>
            <SelectItem value="OUTCOME">Egresos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="status-filter" className="text-sm font-medium">
          Estado
        </Label>
        <Select
          value={value.status}
          onValueChange={(v) => set("status", v as MovementsFilters["status"])}
        >
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="amount-filter" className="text-sm font-medium">
          Monto mínimo
        </Label>
        <Input
          id="amount-filter"
          type="number"
          placeholder="0.00"
          value={value.minAmount?.toString() ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            set("minAmount", v === "" ? undefined : Number(v));
          }}
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onChange({ ...value })}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Aplicar
        </Button>
        <Button size="sm" variant="outline" onClick={reset}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};
