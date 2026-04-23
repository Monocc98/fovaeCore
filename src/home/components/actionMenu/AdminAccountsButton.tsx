import { Wallet } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";

export const AdminAccountsButton = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("c"); // obtiene el query param

  const handleOnCLick = () => {
    const backTo = window.location.pathname + window.location.search;
    if (!companyId) return; // por si no viene el parámetro
    navigate(`/group/${groupId}/accounts/${companyId}`, {
      state: { backTo },
    });
  };
  return (
    <button
      className="w-full flex items-center justify-between p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 border-l-4 border-l-emerald-500"
      onClick={handleOnCLick}
    >
      <div className="flex items-center space-x-3">
        <Wallet className="w-4 h-4 text-emerald-700" />
        <span className="text-sm font-medium text-emerald-900">
          Gestionar Cuentas
        </span>
      </div>
    </button>
  );
};
