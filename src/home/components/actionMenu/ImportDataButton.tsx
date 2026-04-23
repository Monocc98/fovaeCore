import { Upload } from "lucide-react";

interface Props {
  onClick: () => void;
}

export const ImportDataButton = ({ onClick }: Props) => {
  return (
    <button
      className="w-full flex items-center justify-between p-3 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors border border-cyan-200 border-l-4 border-l-cyan-500"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <Upload className="w-4 h-4 text-cyan-700" />
        <span className="text-sm font-medium text-cyan-800">
          Importar Datos
        </span>
      </div>
    </button>
  );
};
