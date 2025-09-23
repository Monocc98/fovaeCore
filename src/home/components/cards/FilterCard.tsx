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

export const FilterCard = () => {
  return (
    <>
      <div>
        <Label htmlFor="date-start" className="text-sm font-medium">
          Fecha Inicio
        </Label>
        <Input id="date-start" type="date" />
      </div>

      <div>
        <Label htmlFor="date-end" className="text-sm font-medium">
          Fecha Fin
        </Label>
        <Input id="date-end" type="date" />
      </div>
      <div>
        <Label htmlFor="type-filter" className="text-sm font-medium">
          Tipo
        </Label>
        <Select>
          <SelectTrigger id="type-filter">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="ingreso">Ingresos</SelectItem>
            <SelectItem value="egreso">Egresos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="status-filter" className="text-sm font-medium">
          Estado
        </Label>
        <Select>
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="amount-filter" className="text-sm font-medium">
          Monto mínimo
        </Label>
        <Input id="amount-filter" type="number" placeholder="0.00" />
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1">
          <Calendar className="h-4 w-4 mr-1" />
          Aplicar
        </Button>
        <Button size="sm" variant="outline">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};
