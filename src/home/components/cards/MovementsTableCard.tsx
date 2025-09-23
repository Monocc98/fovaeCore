import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Movement } from "@/home/types/movement.interface";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Edit,
  Eye,
  ListPlus,
  Search,
  Trash2,
} from "lucide-react";

interface Props {
  movements?: Movement[];
}

function formatDate(dateString: string | Date): string {
  return new Date(dateString).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTransactionIcon(amount: number, transferId: string = "") {
  if (transferId === "") {
    if (amount > 0) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (amount < 0) return <ArrowDownLeft className="w-4 h-4 text-red-600" />;
  } else {
    return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
  }
}

function getTransactionColor(amount: number, transferId: string = "") {
  if (transferId === "") {
    if (amount > 0) return "text-green-600";
    if (amount < 0) return "text-red-600";
  } else {
    return "text-blue-600";
  }
}

function getStatusBadge(status: string) {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case "completed":
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800`}>
          Completado
        </span>
      );
    case "pending":
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
          Pendiente
        </span>
      );
    case "cancelled":
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800`}>
          Cancelado
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
          Desconocido
        </span>
      );
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export const MovementsTableCard = ({ movements = [] }: Props) => {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Movimientos Financieros
            </h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar movimientos..."
                  // value={searchTerm}
                  // onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            {/* //TODO Cambiar a un refresh para volver a pedir los movimientos */}
            <ListPlus className="w-5 h-5 text-gray-400 cursor-pointer hover:text-red-800 transition-colors" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-auto h-[calc(100%-120px)]">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.map((movement) => (
                <tr
                  key={movement.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(movement.occurredAt)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      {getTransactionIcon(movement.amount, movement.transferId)}
                      <div className="truncate max-w-xs">
                        {movement.description}
                        <div className="text-xs text-gray-500">
                          {movement.category.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <span
                      className={getTransactionColor(
                        movement.amount,
                        movement.transferId
                      )}
                    >
                      {formatCurrency(movement.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge("completed")}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-blue-600 hover:text-blue-800 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-green-600 hover:text-green-800 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-red-600 hover:text-red-800 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
