import { Upload } from "lucide-react";

interface Props {
  onClick: () => void;
}

export const ImportDataButton = ({ onClick }: Props) => {
  return (
    <button
      className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <Upload className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-700">
          Importar Datos
        </span>
      </div>
    </button>
  );
};
