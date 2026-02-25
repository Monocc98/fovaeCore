import { Target } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";

export const ObjectiveGraphButton = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("c");

  const handleClick = () => {
    if (!groupId || !companyId) return;
    const backTo = window.location.pathname + window.location.search;
    navigate(`/group/${groupId}/objective-graph/${companyId}`, {
      state: { backTo },
    });
  };

  return (
    <button
      className="w-full flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors border border-amber-100"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        <Target className="w-4 h-4 text-amber-700" />
        <span className="text-sm font-medium text-amber-800">
          Grafica objetivo
        </span>
      </div>
    </button>
  );
};
