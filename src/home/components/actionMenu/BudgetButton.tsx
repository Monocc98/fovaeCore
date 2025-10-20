import { useHomeStore } from "@/home/hooks/useHomeStore";
import { DollarSign } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";

export const BudgetButton = () => {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get("a");

  const handleOnCLick = () => {
    // const year = new Date().getFullYear();
    navigate(`/v2/company/${companyId}/budget/${accountId}`); //?year=${year}
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
