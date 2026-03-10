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
  const investmentCandidates = companyAccounts.filter((a) => a.id !== accountId);

  const accept = source === "SOLUCION_FACTIBLE" ? ".csv" : ".xlsx,.xls";

  const validateFile = (pickedFile: File) => {
    const name = pickedFile.name.toLowerCase();

    if (source === "SOLUCION_FACTIBLE") {
      return name.endsWith(".csv");
    }

    return name.endsWith(".xlsx") || name.endsWith(".xls");
  };

  const setPickedFile = (pickedFile?: File) => {
    if (!pickedFile) return;

    if (!validateFile(pickedFile)) {
      setError(
        source === "SOLUCION_FACTIBLE"
          ? "Solo se aceptan archivos CSV"
          : "Solo se aceptan archivos Excel (.xlsx / .xls)"
      );
      setFile(null);
      return;
    }

    setFile(pickedFile);
    setError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPickedFile(event.target.files?.[0]);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setPickedFile(event.dataTransfer.files?.[0]);
  };

  const handleSourceChange = (next: ImportSource) => {
    setSource(next);
    setFile(null);
    setError(null);
    setInvestmentAccountId("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

      onFileProcessed(data.importBatchId, data.concepts as Concept[], data.totalRows, {
        detectedSections: data.detectedSections ?? [],
        transferCandidatesCount: data.transferCandidatesCount ?? 0,
        sectionAccountMap: investmentAccountId
          ? { INVERSION: investmentAccountId }
          : {},
      });
    } catch (err: any) {
      console.error("Error processing file:", err);
      const backendData = err?.response?.data;
      const backendMessage =
        backendData?.error ||
        backendData?.message ||
        backendData?.details ||
        (Array.isArray(backendData?.errors)
          ? backendData.errors.join(" ")
          : null);

      setError(backendMessage || err?.message || "Error al procesar el archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-6 py-5 text-center sm:px-8 sm:py-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mb-6 sm:h-16 sm:w-16">
            <Upload className="h-6 w-6 text-red-500 sm:h-8 sm:w-8" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Importar movimientos
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {source === "SOLUCION_FACTIBLE"
              ? "Sube el CSV generado por Solucion Factible."
              : "Sube el Excel de ServoEscolar (ingresos)."}
          </p>
        </div>

        <div className="space-y-4 px-6 pb-6 sm:px-8">
          <div className="rounded-lg bg-gray-50 p-3 text-left">
            <p className="mb-2 text-xs text-gray-500">Fuente</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2">
                <input
                  type="radio"
                  name="source"
                  checked={source === "SOLUCION_FACTIBLE"}
                  onChange={() => handleSourceChange("SOLUCION_FACTIBLE")}
                />
                <span className="text-sm">Solucion Factible (CSV)</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2">
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

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-left">
                <span className="text-gray-600">Cuenta:</span>
                <p className="font-medium text-gray-900">{accountName}</p>
              </div>

              <div className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                {source === "SOLUCION_FACTIBLE"
                  ? "Solucion Factible"
                  : "ServoEscolar"}
              </div>
            </div>
          </div>

          {source === "SOLUCION_FACTIBLE" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
              <p className="mb-2 text-xs text-blue-700">
                Cuenta para seccion de inversion (opcional)
              </p>
              <select
                value={investmentAccountId}
                onChange={(event) => setInvestmentAccountId(event.target.value)}
                className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={accountsQuery.isLoading}
              >
                <option value="">No asignar cuenta de inversion</option>
                {investmentCandidates.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="mb-1 font-medium text-gray-700">
              Arrastra y suelta el archivo aqui o haz clic para seleccionarlo
            </p>
            <p className="text-sm text-gray-500">Permitido: {accept}</p>
          </div>

          {file && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">
                <span className="font-medium">Archivo seleccionado:</span>{" "}
                {file.name}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-gray-200 px-4 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-300"
          >
            Cancelar
          </button>

          <button
            onClick={handleProcess}
            disabled={!file || loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              "Procesar archivo"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
