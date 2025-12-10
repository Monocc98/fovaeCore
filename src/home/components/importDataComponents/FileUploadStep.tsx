import React, { useState, useRef } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { importSolucionFactibleAction } from "@/home/actions/movements.actions";

interface Concept {
  externalConceptKey: string;
  externalCategoryRaw: string;
  count: number;
  existingRule: {
    subsubcategoryId: string;
    confirmedCount: number;
  } | null;
}

interface FileUploadStepProps {
  accountId: string;
  accountName: string;
  onFileProcessed: (
    batchId: string,
    concepts: Concept[],
    totalRows: number
  ) => void;
  onCancel: () => void;
}

export const FileUploadStep = ({
  accountId,
  accountName,
  onFileProcessed,
  onCancel,
}: FileUploadStepProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Solo se aceptan archivos CSV");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith(".csv")) {
        setError("Solo se aceptan archivos CSV");
        setFile(null);
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await importSolucionFactibleAction(accountId, file);

      // 👈 OJO: el backend devuelve importBatchId, no batchId
      onFileProcessed(
        data.importBatchId,
        data.concepts as Concept[],
        data.totalRows
      );
    } catch (err: any) {
      console.error("Error processing file:", err);
      setError(err.message || "Error al procesar el archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
          <Upload className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Importar movimientos desde Solución Factible
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Selecciona el archivo CSV generado por Solución Factible para analizar
          los movimientos y agruparlos por concepto.
        </p>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <span className="text-gray-600">Cuenta:</span>
              <p className="font-medium text-gray-900">{accountName}</p>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              Solución Factible
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 flex-1">
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">
            Arrastra y suelta el archivo aquí o haz clic para seleccionarlo
          </p>
          <p className="text-gray-500 text-sm">
            Formato esperado: columnas Número, Fecha, Categoría, Nombre, Monto.
            Separador de comas.
          </p>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <span className="font-medium">Archivo seleccionado:</span>{" "}
              {file.name}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleProcess}
          disabled={!file || loading}
          className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Procesando...</span>
            </>
          ) : (
            "Procesar archivo"
          )}
        </button>
      </div>
    </>
  );
};
