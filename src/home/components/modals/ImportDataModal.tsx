import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Trash2 } from "lucide-react";
import { FileUploadStep } from "../importDataComponents/FileUploadStep";
import { ConceptMappingStep } from "../importDataComponents/ConceptMappingStep";
import {
  deleteImportBatchAction,
  getImportBatchSummaryAction,
} from "@/home/actions/movements.actions";

interface Concept {
  externalConceptKey: string;
  externalCategoryRaw: string;
  count: number;
  existingRule: {
    subsubcategoryId: string;
    confirmedCount: number;
  } | null;
}

interface ImportDataModalProps {
  isOpen: boolean;
  accountId: string;
  accountName: string;
  resumeBatchId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const createEmptyState = () => ({
  step: "upload" as const,
  batchId: "",
  concepts: [] as Concept[],
  totalRows: 0,
  detectedSections: [] as string[],
  resolvedSectionAccounts: [] as Array<{
    sourceAccountLabel: string;
    accountId: string;
  }>,
  transferCandidatesCount: 0,
  sectionAccountMap: {} as Record<string, string>,
});

export const ImportDataModal = ({
  isOpen,
  accountId,
  accountName,
  resumeBatchId,
  onClose,
  onSuccess,
}: ImportDataModalProps) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"upload" | "mapping">("upload");
  const [batchId, setBatchId] = useState<string>("");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [detectedSections, setDetectedSections] = useState<string[]>([]);
  const [resolvedSectionAccounts, setResolvedSectionAccounts] = useState<
    Array<{ sourceAccountLabel: string; accountId: string }>
  >([]);
  const [transferCandidatesCount, setTransferCandidatesCount] = useState(0);
  const [sectionAccountMap, setSectionAccountMap] = useState<Record<string, string>>({});

  const resumeQuery = useQuery({
    queryKey: ["importBatchSummary", resumeBatchId],
    queryFn: () => getImportBatchSummaryAction(resumeBatchId!),
    enabled: isOpen && !!resumeBatchId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const deleteBatchMut = useMutation({
    mutationFn: deleteImportBatchAction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["pendingImportBatches", accountId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["importBatchSummary", resumeBatchId],
      });
      handleClose();
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    if (!resumeBatchId) {
      const state = createEmptyState();
      setStep(state.step);
      setBatchId(state.batchId);
      setConcepts(state.concepts);
      setTotalRows(state.totalRows);
      setDetectedSections(state.detectedSections);
      setResolvedSectionAccounts(state.resolvedSectionAccounts);
      setTransferCandidatesCount(state.transferCandidatesCount);
      setSectionAccountMap(state.sectionAccountMap);
    }
  }, [isOpen, resumeBatchId]);

  useEffect(() => {
    if (!resumeQuery.data || !resumeBatchId) return;

    const summary = resumeQuery.data;
    const normalizedConcepts: Concept[] = summary.concepts.map((concept) => ({
      externalConceptKey: concept.externalConceptKey,
      externalCategoryRaw: concept.externalCategoryRaw,
      count: concept.count,
      existingRule: concept.existingRule
        ? {
            subsubcategoryId: concept.existingRule.id,
            confirmedCount: concept.existingRule.timesConfirmed,
          }
        : null,
    }));

    setBatchId(summary.importBatchId);
    setConcepts(normalizedConcepts);
    setTotalRows(summary.totalRows);
    setDetectedSections(summary.detectedSections ?? []);
    setResolvedSectionAccounts(summary.resolvedSectionAccounts ?? []);
    setTransferCandidatesCount(summary.transferCandidatesCount ?? 0);
    setSectionAccountMap(
      summary.sectionAccountMap ??
        Object.fromEntries(
          (summary.resolvedSectionAccounts ?? []).map((item) => [
            item.sourceAccountLabel,
            item.accountId,
          ])
        )
    );
    setStep("mapping");
  }, [resumeBatchId, resumeQuery.data]);

  const resetState = () => {
    const state = createEmptyState();
    setStep(state.step);
    setBatchId(state.batchId);
    setConcepts(state.concepts);
    setTotalRows(state.totalRows);
    setDetectedSections(state.detectedSections);
    setResolvedSectionAccounts(state.resolvedSectionAccounts);
    setTransferCandidatesCount(state.transferCandidatesCount);
    setSectionAccountMap(state.sectionAccountMap);
  };

  const handleFileProcessed = (
    newBatchId: string,
    newConcepts: Concept[],
    rows: number,
    meta?: {
      detectedSections?: string[];
      resolvedSectionAccounts?: Array<{
        sourceAccountLabel: string;
        accountId: string;
      }>;
      transferCandidatesCount?: number;
      sectionAccountMap?: Record<string, string>;
    }
  ) => {
    setBatchId(newBatchId);
    setConcepts(newConcepts);
    setTotalRows(rows);
    setDetectedSections(meta?.detectedSections ?? []);
    setResolvedSectionAccounts(meta?.resolvedSectionAccounts ?? []);
    setTransferCandidatesCount(meta?.transferCandidatesCount ?? 0);
    setSectionAccountMap(
      meta?.sectionAccountMap ??
        Object.fromEntries(
          (meta?.resolvedSectionAccounts ?? []).map((item) => [
            item.sourceAccountLabel,
            item.accountId,
          ])
        )
    );
    setStep("mapping");
  };

  const handleBack = () => {
    if (resumeBatchId) {
      handleClose();
      return;
    }

    resetState();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess?.();
  };

  const handleDeleteBatch = () => {
    if (!resumeBatchId || deleteBatchMut.isPending) return;

    const confirmed = window.confirm(
      "Se descartara este proceso pendiente y no podras retomarlo. Deseas continuar?"
    );

    if (!confirmed) return;

    deleteBatchMut.mutate(resumeBatchId);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-50 flex items-stretch justify-center p-2 sm:items-center sm:p-4">
        <div className="relative flex h-[calc(100dvh-1rem)] min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[90dvh]">
          {resumeBatchId && !resumeQuery.isPending && !resumeQuery.isError && (
            <button
              type="button"
              onClick={handleDeleteBatch}
              disabled={deleteBatchMut.isPending}
              className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              <span>
                {deleteBatchMut.isPending
                  ? "Descartando..."
                  : "Descartar proceso"}
              </span>
            </button>
          )}
          {resumeBatchId && resumeQuery.isPending ? (
            <div className="min-h-0 flex-1 px-6 py-8 animate-pulse">
              <div className="mx-auto max-w-3xl space-y-5">
                <div>
                  <div className="h-7 w-64 rounded bg-gray-200" />
                  <div className="mt-3 h-4 w-96 rounded bg-gray-100" />
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="mb-5 h-5 w-48 rounded bg-gray-200" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="h-20 rounded-lg bg-gray-100" />
                    <div className="h-20 rounded-lg bg-gray-100" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="mb-4 h-5 w-56 rounded bg-gray-200" />
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="grid grid-cols-3 gap-3">
                        <div className="h-9 rounded bg-gray-100" />
                        <div className="h-9 rounded bg-gray-100" />
                        <div className="h-9 rounded bg-gray-200" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : resumeBatchId && resumeQuery.isError ? (
            <div className="flex min-h-0 flex-1 items-center justify-center px-6">
              <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-5 text-center">
                <AlertCircle className="mx-auto mb-3 h-6 w-6 text-red-500" />
                <p className="text-sm text-red-700">
                  No se pudo cargar el proceso pendiente. Intenta de nuevo.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : step === "upload" ? (
            <FileUploadStep
              accountId={accountId}
              accountName={accountName}
              onFileProcessed={handleFileProcessed}
              onCancel={handleClose}
            />
          ) : (
            <ConceptMappingStep
              batchId={batchId}
              concepts={concepts}
              totalRows={totalRows}
              detectedSections={detectedSections}
              resolvedSectionAccounts={resolvedSectionAccounts}
              transferCandidatesCount={transferCandidatesCount}
              initialSectionAccountMap={sectionAccountMap}
              onBack={handleBack}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </div>
    </>
  );
};
