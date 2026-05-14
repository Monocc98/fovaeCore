import { Landmark } from "lucide-react";
import { useNavigate, useParams } from "react-router";

export const DividendsButton = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  const handleClick = () => {
    if (!groupId) return;

    const backTo = location.pathname + location.search;
    navigate(`/group/${groupId}/dividends`, {
      state: { backTo },
    });
  };

  return (
    <button
      className="w-full flex items-center justify-between p-3 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors border border-cyan-200 border-l-4 border-l-cyan-600"
      onClick={handleClick}
      type="button"
    >
      <div className="flex items-center space-x-3">
        <Landmark className="w-4 h-4 text-cyan-700" />
        <span className="text-sm font-medium text-cyan-800">Dividendos</span>
      </div>
    </button>
  );
};
