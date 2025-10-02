import { useHomeStore } from "@/home/hooks/useHomeStore";
import { DollarSign } from "lucide-react";
import { useNavigate } from "react-router";

export const BudgetButton = () => {
  const { activeAccountId } = useHomeStore();
  const navigate = useNavigate();

  const handleOnCLick = () => {
    navigate(`/budget/${activeAccountId}`);
  };

  return (
    <button
      className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
      onClick={handleOnCLick}
    >
      <div className="flex items-center space-x-3">
        <DollarSign className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-purple-700">
          Revisar Presupuestos
        </span>
      </div>
    </button>
  );
};
