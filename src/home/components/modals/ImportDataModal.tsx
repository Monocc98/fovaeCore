import { useState } from "react";
import { FileUploadStep } from "../importDataComponents/FileUploadStep";
import { ConceptMappingStep } from "../importDataComponents/ConceptMappingStep";

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
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportDataModal = ({
  isOpen,
  accountId,
  accountName,
  onClose,
  onSuccess,
}: ImportDataModalProps) => {
  const [step, setStep] = useState<"upload" | "mapping">("upload");
  const [batchId, setBatchId] = useState<string>("");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [detectedSections, setDetectedSections] = useState<string[]>([]);
  const [transferCandidatesCount, setTransferCandidatesCount] = useState(0);
  const [sectionAccountMap, setSectionAccountMap] = useState<Record<string, string>>({});

  const handleFileProcessed = (
    newBatchId: string,
    newConcepts: Concept[],
    rows: number,
    meta?: {
      detectedSections?: string[];
      transferCandidatesCount?: number;
      sectionAccountMap?: Record<string, string>;
    }
  ) => {
    setBatchId(newBatchId);
    setConcepts(newConcepts);
    setTotalRows(rows);
    setDetectedSections(meta?.detectedSections ?? []);
    setTransferCandidatesCount(meta?.transferCandidatesCount ?? 0);
    setSectionAccountMap(meta?.sectionAccountMap ?? {});
    setStep("mapping");
  };

  const handleBack = () => {
    setStep("upload");
    setBatchId("");
    setConcepts([]);
    setTotalRows(0);
    setDetectedSections([]);
    setTransferCandidatesCount(0);
    setSectionAccountMap({});
  };

  const handleClose = () => {
    setStep("upload");
    setBatchId("");
    setConcepts([]);
    setTotalRows(0);
    setDetectedSections([]);
    setTransferCandidatesCount(0);
    setSectionAccountMap({});
    onClose();
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess?.();
  };

  if (!isOpen) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={handleClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {step === "upload" ? (
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
