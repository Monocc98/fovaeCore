import { LibraryBig } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";

export const AdminCategoriesButton = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("c"); // obtiene el query param

  const handleOnCLick = () => {
    const backTo = location.pathname + location.search;
    navigate(`/group/${groupId}/categories/${companyId}`, {
      state: { backTo },
    });
  };

  return (
    <button
      className="w-full flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200 border-l-4 border-l-amber-500"
      onClick={handleOnCLick}
    >
      <div className="flex items-center space-x-3">
        <LibraryBig className="w-4 h-4 text-amber-700" />
        <span className="text-sm font-medium text-amber-900">
          Administrar Categorías
        </span>
      </div>
    </button>
  );
};
