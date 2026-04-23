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
      className="w-full flex items-center justify-between p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200 border-l-4 border-l-teal-500"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        <Target className="w-4 h-4 text-teal-700" />
        <span className="text-sm font-medium text-teal-900">
          Grafica objetivo
        </span>
      </div>
    </button>
  );
};
