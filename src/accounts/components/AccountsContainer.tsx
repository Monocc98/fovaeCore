import { Plus, Edit2, Trash2, Wallet } from "lucide-react";
import { getTypeIcon } from "../helpers";
import { getTypeBadgeColor } from "../helpers/getTypeBadgeColor";
import type { Account } from "@/types";

type Props = {
  accounts: Account[];
  onCreate: () => void;
  onBack: () => void;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
};

export const AccountsContainer = ({accounts, onCreate, onBack, onEdit, onDelete}: Props) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Administración de Cuentas
            </h2>
            <p className="text-gray-600 mt-1">
              Gestiona las cuentas bancarias y de efectivo de tu empresa
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onCreate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Cuenta</span>
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>

        <div className="p-6">
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay cuentas registradas
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza agregando tu primera cuenta
              </p>
              <button
                onClick={onCreate}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Agregar Cuenta</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(account.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {account.name}
                        </h3>
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${getTypeBadgeColor(
                            account.type
                          )}`}
                        >
                          {account.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(account)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => onDelete(account.id)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  )
}
