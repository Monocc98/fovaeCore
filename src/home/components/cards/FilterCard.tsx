import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { MovementsFilters } from "@/types/movements-filters.interface";
import type { Category } from "@/types";

interface Props {
  value: MovementsFilters;
  onChange: (next: MovementsFilters) => void;
  categories?: Category[];
}

export const FilterCard = ({ value, onChange, categories = [] }: Props) => {
  const ALL_VALUE = "__ALL__";
  const set = <K extends keyof MovementsFilters>(
    k: K,
    v: MovementsFilters[K]
  ) => onChange({ ...value, [k]: v });

  const setMany = (patch: Partial<MovementsFilters>) =>
    onChange({ ...value, ...patch });

  // const reset = () =>
  //   onChange({
  //     q: "",
  //     type: "ALL",
  //     status: "ALL",
  //     categoryId: undefined,
  //     subcategoryId: undefined,
  //     subsubcategoryId: undefined,
  //     dateFrom: undefined,
  //     dateTo: undefined,
  //     minAmount: undefined,
  //   });

  const selectedCategory =
    categories.find((c) => c._id === value.categoryId) ?? null;
  const subcategories = selectedCategory?.subcategories ?? [];
  const selectedSubcategory =
    subcategories.find((s) => s._id === value.subcategoryId) ?? null;
  const subsubcategories = selectedSubcategory?.subsubcategories ?? [];

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
        <Label htmlFor="category-filter" className="text-sm font-medium">
          Categoria
        </Label>
        <Select
          value={value.categoryId ?? ALL_VALUE}
          onValueChange={(v) =>
            setMany({
              categoryId: v === ALL_VALUE ? undefined : v,
              subcategoryId: undefined,
              subsubcategoryId: undefined,
            })
          }
        >
          <SelectTrigger id="category-filter">
            <SelectValue placeholder="Todas las categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas las categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="subcategory-filter" className="text-sm font-medium">
          Subcategoria
        </Label>
        <Select
          value={value.subcategoryId ?? ALL_VALUE}
          onValueChange={(v) =>
            setMany({
              subcategoryId: v === ALL_VALUE ? undefined : v,
              subsubcategoryId: undefined,
            })
          }
          disabled={!value.categoryId}
        >
          <SelectTrigger id="subcategory-filter">
            <SelectValue placeholder="Todas las subcategorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas las subcategorias</SelectItem>
            {subcategories.map((sub) => (
              <SelectItem key={sub._id} value={sub._id}>
                {sub.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="subsubcategory-filter" className="text-sm font-medium">
          Detalle
        </Label>
        <Select
          value={value.subsubcategoryId ?? ALL_VALUE}
          onValueChange={(v) =>
            set("subsubcategoryId", v === ALL_VALUE ? undefined : v)
          }
          disabled={!value.subcategoryId}
        >
          <SelectTrigger id="subsubcategory-filter">
            <SelectValue placeholder="Todos los detalles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos los detalles</SelectItem>
            {subsubcategories.map((leaf) => (
              <SelectItem key={leaf._id} value={leaf._id}>
                {leaf.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
        <Label
          htmlFor="show-transfers-filter"
          className="text-sm font-medium text-gray-700"
        >
          Transferencias
        </Label>
        <Switch
          id="show-transfers-filter"
          checked={value.showTransfers ?? true}
          onCheckedChange={(checked) => set("showTransfers", checked)}
        />
      </div>
      {/* 
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
      </div> */}

      {/* <div>
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
      </div> */}
    </>
  );
};
