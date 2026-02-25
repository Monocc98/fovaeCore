import { BarChart3, ChevronDown, Target } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useParams, useSearchParams } from "react-router";

const options = [
  {
    id: "expense-budget",
    title: "Presupuesto vs Egresos",
    description: "Seguimiento mensual por categoria",
    icon: Target,
    iconClass: "text-amber-700",
    hoverClass: "focus:bg-amber-50",
  },
] as const;

export const GraphDropdownButton = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("c");

  const handleSelect = () => {
    if (!groupId || !companyId) return;
    const backTo = window.location.pathname + window.location.search;
    navigate(`/group/${groupId}/objective-graph/${companyId}`, {
      state: { backTo },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center justify-between p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">
              Graficos
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
              onClick={handleSelect}
              className={[
                "w-full text-left px-4 py-3 transition-colors flex items-center space-x-3 rounded-none",
                opt.hoverClass,
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
