import {
  Activity,
  BarChart3,
  ChevronDown,
  PieChart,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type GraphType = "all" | "monthly" | "category";

interface Props {
  onSelect?: (type: GraphType, mockData: unknown) => void;
}

const graphMockData: Record<GraphType, unknown> = {
  all: {
    monthly: [
      { month: "Ene", income: 12000, expense: 9000 },
      { month: "Feb", income: 10500, expense: 9800 },
      { month: "Mar", income: 14000, expense: 11000 },
    ],
    category: [
      { name: "Ventas", value: 55 },
      { name: "Operacion", value: 25 },
      { name: "Administracion", value: 20 },
    ],
  },
  monthly: [
    { month: "Ene", income: 12000, expense: 9000 },
    { month: "Feb", income: 10500, expense: 9800 },
    { month: "Mar", income: 14000, expense: 11000 },
  ],
  category: [
    { name: "Ventas", value: 55 },
    { name: "Operacion", value: 25 },
    { name: "Administracion", value: 20 },
  ],
};

const options: Array<{
  id: GraphType;
  title: string;
  description: string;
  icon: typeof Activity;
  iconClass: string;
  hoverClass: string;
  borderTop?: boolean;
}> = [
  {
    id: "all",
    title: "Todas las Graficas",
    description: "Vista completa del analisis",
    icon: Activity,
    iconClass: "text-blue-600",
    hoverClass: "focus:bg-blue-50",
  },
  {
    id: "monthly",
    title: "Balance Mensual",
    description: "Ingresos vs egresos por mes",
    icon: BarChart3,
    iconClass: "text-green-600",
    hoverClass: "focus:bg-green-50",
    borderTop: true,
  },
  {
    id: "category",
    title: "Analisis por Categoria",
    description: "Distribucion general por rubros",
    icon: PieChart,
    iconClass: "text-amber-600",
    hoverClass: "focus:bg-amber-50",
    borderTop: true,
  },
];

export const GraphDropdownButton = ({ onSelect }: Props) => {
  const [selectedGraphType, setSelectedGraphType] = useState<GraphType>("all");

  const selectedLabel = useMemo(
    () => options.find((opt) => opt.id === selectedGraphType)?.title ?? "Graficas",
    [selectedGraphType]
  );

  const handleSelect = (type: GraphType) => {
    setSelectedGraphType(type);
    onSelect?.(type, graphMockData[type]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center justify-between p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">
              Ver Graficas: {selectedLabel}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-indigo-600" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-[min(22rem,calc(100vw-4rem))] p-0 overflow-hidden"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <DropdownMenuItem
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={[
                "w-full text-left px-4 py-3 transition-colors flex items-center space-x-3 rounded-none",
                opt.hoverClass,
                opt.borderTop ? "border-t border-gray-100" : "",
              ].join(" ")}
            >
              <Icon className={`w-4 h-4 ${opt.iconClass}`} />
              <div>
                <div className="text-sm font-medium text-gray-900">{opt.title}</div>
                <div className="text-xs text-gray-500">{opt.description}</div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
