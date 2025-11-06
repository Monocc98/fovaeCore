import { formatCurrency, formatDate, getTransactionColor } from "@/helpers";
import type { Movement } from "@/types";
import { Trash2 } from "lucide-react";

interface Props {
  movement: Movement;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const DeleteMovementAlert = ({
  movement,
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
          ¿Eliminar Movimiento?
        </h3>

        <p className="text-gray-600 text-center mb-6">
          Esta acción no se puede deshacer. El movimiento será eliminado
          permanentemente.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Descripción:</span>
            <span className="text-sm font-medium text-gray-900 max-w-48 truncate">
              {movement.description}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Monto:</span>
            <span
              className={`text-sm font-medium ${getTransactionColor(
                movement.amount
              )}`}
            >
              {formatCurrency(movement.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Fecha:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatDate(movement.occurredAt)}
            </span>
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
            {isLoading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
};
