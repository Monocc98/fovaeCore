import type { Row } from "@/categories/pages/CategoriesPage";
import { getLevelBadge, getScopeBadge } from "@/helpers";
import { Trash2 } from "lucide-react";

interface Props {
  category: Row;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const DeleteCategoryAlert = ({
  category,
  onCancel,
  onConfirm,
  isLoading,
}: Props) => {
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
          <Trash2 className="w-8 h-8 text-red-600" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          ¿Eliminar Categoría?
        </h3>

        <p className="text-gray-600 text-center mb-6">
          Esta acción eliminará la categoría y todas sus subcategorías. No se
          puede deshacer.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Categoría:</span>
            <span className="text-sm font-medium text-gray-900">
              {category.name}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Nivel:</span>
            <div>{getLevelBadge(category.level)}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Alcance:</span>
            <div>{getScopeBadge(category.scope)}</div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
