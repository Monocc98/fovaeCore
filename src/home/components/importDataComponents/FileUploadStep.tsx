import React, { useRef, useState } from "react";
import { Upload, AlertCircle } from "lucide-react";
import {
  importSolucionFactibleAction,
  importServoEscolarAction,
} from "@/home/actions/movements.actions";
import { useQuery } from "@tanstack/react-query";
import { getAccountsAction } from "@/accounts/actions/acounts.actions";
import { useParams } from "react-router";

type ImportSource = "SOLUCION_FACTIBLE" | "SERVO_ESCOLAR";

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
    totalRows: number,
    meta?: {
      detectedSections?: string[];
      transferCandidatesCount?: number;
      sectionAccountMap?: Record<string, string>;
    }
  ) => void;
  onCancel: () => void;
}

export const FileUploadStep = ({
  accountId,
  accountName,
  onFileProcessed,
  onCancel,
}: FileUploadStepProps) => {
  const [source, setSource] = useState<ImportSource>("SOLUCION_FACTIBLE");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [investmentAccountId, setInvestmentAccountId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { companyId } = useParams<{ companyId?: string }>();

  const accountsQuery = useQuery({
    queryKey: ["accounts", companyId],
    queryFn: () => getAccountsAction(companyId!),
    enabled: !!companyId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const companyAccounts = accountsQuery.data?.accounts ?? [];
  const investmentCandidates = companyAccounts.filter(
    (a) => a.id !== accountId
  );

  const accept = source === "SOLUCION_FACTIBLE" ? ".csv" : ".xlsx,.xls";

  const validateFile = (f: File) => {
    const name = f.name.toLowerCase();
    if (source === "SOLUCION_FACTIBLE") return name.endsWith(".csv");
    return name.endsWith(".xlsx") || name.endsWith(".xls");
  };

  const setPickedFile = (f?: File) => {
    if (!f) return;

    if (!validateFile(f)) {
      setError(
        source === "SOLUCION_FACTIBLE"
          ? "Solo se aceptan archivos CSV"
          : "Solo se aceptan archivos Excel (.xlsx / .xls)"
      );
      setFile(null);
      return;
    }

    setFile(f);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPickedFile(e.target.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPickedFile(e.dataTransfer.files?.[0]);
  };

  const handleSourceChange = (next: ImportSource) => {
    setSource(next);
    setFile(null);
    setError(null);
    setInvestmentAccountId("");
    if (fileInputRef.current) fileInputRef.current.value = ""; // reset input
  };

  const handleProcess = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data =
        source === "SOLUCION_FACTIBLE"
          ? await importSolucionFactibleAction(accountId, file, {
            investmentAccountId: investmentAccountId || undefined,
          })
          : await importServoEscolarAction(accountId, file);

      onFileProcessed(
        data.importBatchId,
        data.concepts as Concept[],
        data.totalRows,
        {
          detectedSections: data.detectedSections ?? [],
          transferCandidatesCount: data.transferCandidatesCount ?? 0,
          sectionAccountMap: investmentAccountId
            ? { INVERSION: investmentAccountId }
            : {},
        }
      );
    } catch (err: any) {
      console.error("Error processing file:", err);
      setError(err.message || "Error al procesar el archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ Step container: header fijo + body con scroll + footer fijo
    <div className="flex flex-col flex-1 min-h-0">
      {/* HEADER */}
      <div className="p-8 text-center shrink-0 border-b border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
          <Upload className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Importar movimientos
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          {source === "SOLUCION_FACTIBLE"
            ? "Sube el CSV generado por Solución Factible."
            : "Sube el Excel de ServoEscolar (ingresos)."}
        </p>

        {/* Selector fuente */}
        <div className="mx-auto p-3 bg-gray-50 rounded-lg text-left mb-4">
          <p className="text-xs text-gray-500 mb-2">Fuente</p>
          <div className="flex justify-around gap-3">
            <label className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer">
              <input
                type="radio"
                name="source"
                checked={source === "SOLUCION_FACTIBLE"}
                onChange={() => handleSourceChange("SOLUCION_FACTIBLE")}
              />
              <span className="text-sm">Solución Factible (CSV)</span>
            </label>

            <label className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer">
              <input
                type="radio"
                name="source"
                checked={source === "SERVO_ESCOLAR"}
                onChange={() => handleSourceChange("SERVO_ESCOLAR")}
              />
              <span className="text-sm">ServoEscolar (Excel)</span>
            </label>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <span className="text-gray-600">Cuenta:</span>
              <p className="font-medium text-gray-900">{accountName}</p>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {source === "SOLUCION_FACTIBLE"
                ? "Solución Factible"
                : "ServoEscolar"}
            </div>
          </div>
        </div>

        {source === "SOLUCION_FACTIBLE" && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left border border-blue-200">
            <p className="text-xs text-blue-700 mb-2">
              Cuenta para sección de inversión (opcional)
            </p>
            <select
              value={investmentAccountId}
              onChange={(e) => setInvestmentAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={accountsQuery.isLoading}
            >
              <option value="">No asignar cuenta de inversión</option>
              {investmentCandidates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* BODY SCROLL */}
      <div className="px-8 py-6 flex-1 overflow-y-auto">
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">
            Arrastra y suelta el archivo aquí o haz clic para seleccionarlo
          </p>
          <p className="text-gray-500 text-sm">Permitido: {accept}</p>
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
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* FOOTER FIJO */}
      <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex gap-3 shrink-0">
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
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            "Procesar archivo"
          )}
        </button>
      </div>
    </div>
  );
};
