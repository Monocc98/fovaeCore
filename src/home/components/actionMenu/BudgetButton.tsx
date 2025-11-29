import { DollarSign } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";

export const BudgetButton = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("c"); // obtiene el query param

  const handleOnCLick = () => {
    // const year = new Date().getFullYear();
    const backTo = location.pathname + location.search;
    navigate(`/group/${groupId}/budget/${companyId}`, {
      state: { backTo },
    }); //?year=${year}
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
