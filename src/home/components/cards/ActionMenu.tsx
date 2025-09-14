import { FileText, DollarSign, Building2 } from "lucide-react";

export const ActionMenu = () => {
  return (
    <div className="space-y-3">
      <button className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
        <div className="flex items-center space-x-3">
          <DollarSign className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">
            Revisar Presupuestos
          </span>
        </div>
      </button>
      <button className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
        <div className="flex items-center space-x-3">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            Generar Reporte
          </span>
        </div>
      </button>
      <button className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
        <div className="flex items-center space-x-3">
          <Building2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">
            Gestionar Cuentas
          </span>
        </div>
      </button>
    </div>
  );
};
