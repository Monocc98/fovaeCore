import { useHomeStore } from "@/home/hooks/useHomeStore";
import { LibraryBig } from "lucide-react";
import { useNavigate } from "react-router";

export const AdminCategoriesButton = () => {
  const { activeCompanyId } = useHomeStore();
  const navigate = useNavigate();

  const handleOnCLick = () => {
    navigate(`/categories/${activeCompanyId}`);
  };

  return (
    <button
      className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
      onClick={handleOnCLick}
    >
      <div className="flex items-center space-x-3">
        <LibraryBig className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-700">
          Administrar Categorías
        </span>
      </div>
    </button>
  );
};
