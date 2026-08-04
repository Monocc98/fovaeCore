import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { Movement } from "../../types";

export interface MovementsByAccountResponse {
    movements: Movement[];
    balance: number;
}

export interface ImportMovementsResponse {
  importBatchId: string;
  accountId: string;
  source: "SOLUCION_FACTIBLE" | "SERVO_ESCOLAR" | string;
  totalRows: number;
  detectedSections?: string[];
  resolvedSectionAccounts?: Array<{
    sourceAccountLabel: string;
    accountId: string;
  }>;
  transferCandidatesCount?: number;
  concepts: Array<{
    externalConceptKey: string;
    externalCategoryRaw: string;
    count: number;
    existingRule: any | null;
  }>;
}

export type ImportSource = "SOLUCION_FACTIBLE" | "SERVO_ESCOLAR";

export interface ConfirmImportResponse {
  message: string;
  insertedCount: number;
  transferCreatedCount?: number;
}

export type ImportBatchStatus = "PENDING" | "PROCESSED" | "FAILED" | "PROCESSING";
export type ImportBatchSource = "SOLUCION_FACTIBLE" | "SERVO_ESCOLAR" | string;

export interface PendingImportBatch {
  id: string;
  source: ImportBatchSource;
  status: ImportBatchStatus;
  createdAt: string;
  totalRows: number;
}

export interface PendingImportBatchesResponse {
  batches: PendingImportBatch[];
}

export interface ImportBatchSummaryResponse {
  importBatchId: string;
  accountId: string;
  source: ImportBatchSource;
  status: ImportBatchStatus; // en tu backend devuelve PENDING
  totalRows: number;
  detectedSections?: string[];
  resolvedSectionAccounts?: Array<{
    sourceAccountLabel: string;
    accountId: string;
  }>;
  transferCandidatesCount?: number;
  sectionAccountMap?: Record<string, string>;
  concepts: Array<{
    externalConceptKey: string;
    externalCategoryRaw: string;
    count: number;
    existingRule: {
      id: string;
      subsubcategory: string;
      timesConfirmed: number;
      timesCorrected: number;
      locked: boolean;
    } | null;
  }>;
}

export const getMovementsAction = async( idAccount: string, fiscalYearId?: string ):Promise<MovementsByAccountResponse> => {
    const { data } = await fovaeCoreApi.get<MovementsByAccountResponse>(`/movements/account/${idAccount}`, {
      params: fiscalYearId ? { fiscalYearId } : undefined
    });

    return data;
}

export const getMovementByIdAction = async( idMovement: string ):Promise<Movement> => {
    const { data } = await fovaeCoreApi.get<Movement>(`/movements/${idMovement}`);

    return data;
}

export const createMovementAction = async(payload: Movement): Promise<Movement> => {
    const body: Movement = {
        ...payload,
    };

    const { data } = await fovaeCoreApi.post("/movements", body);

    return data.movement;
}

export const updateMovementAction = async(idMovement: string, payload: Movement): Promise<Movement> => {
    const body: Movement = {
        ...payload,
        updatedAt: new Date().toISOString() as any,
    }

    const { data } = await fovaeCoreApi.put<Movement>(`/movements/${idMovement}`, body);
    return data;
}

export const deleteMovementAction = async(idMovement: string) => {
    const { data } = await fovaeCoreApi.delete<Movement>(`movements/${idMovement}`);
    
    return data;
}

export const getPendingImportBatchesByAccountAction = async (
  idAccount: string
): Promise<PendingImportBatchesResponse> => {
  const { data } = await fovaeCoreApi.get<PendingImportBatchesResponse>(
    `/movements/importBatches/pending/${idAccount}`
  );

  return data;
};

export const getImportBatchSummaryAction = async (
  idBatch: string
): Promise<ImportBatchSummaryResponse> => {
  const { data } = await fovaeCoreApi.get<ImportBatchSummaryResponse>(
    `/movements/importBatches/summary/${idBatch}`
  );

  return data;
};

export const deleteImportBatchAction = async (idBatch: string) => {
  const { data } = await fovaeCoreApi.delete(`/movements/importBatches/${idBatch}`);

  return data;
};

export const importSolucionFactibleAction = async (
  accountId: string,
  file: File,
  opts?: {
    investmentAccountId?: string;
    accountMappings?: Record<string, string>;
  }
): Promise<ImportMovementsResponse> => {
  const formData = new FormData();
  formData.append("file", file);          // nombre que espera Multer
  formData.append("accountId", accountId);
  if (opts?.investmentAccountId) {
    formData.append("investmentAccountId", opts.investmentAccountId);
  }
  if (opts?.accountMappings && Object.keys(opts.accountMappings).length > 0) {
    formData.append("accountMappings", JSON.stringify(opts.accountMappings));
  }

  // OJO: ruta relativa a TU API, SIN /api si ya lo pone el baseURL
  const { data } = await fovaeCoreApi.post<ImportMovementsResponse>(
    "/movements/imports/solucion-factible", // ajusta si tu ruta es distinta
    formData,
    {
      // en navegador no es obligatorio, Axios genera el boundary
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export const importServoEscolarAction = async (
  accountId: string,
  file: File
): Promise<ImportMovementsResponse> => {
  const formData = new FormData();
  formData.append("file", file);          // nombre que espera Multer
  formData.append("accountId", accountId);

  const { data } = await fovaeCoreApi.post<ImportMovementsResponse>(
    "/movements/imports/servo-escolar",    // ✅ ajusta a tu route real
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export const confirmImportAction = async (
  batchId: string,
  concepts: Array<{ externalConceptKey: string; subsubcategoryId: string }>,
  accountMappings?: Record<string, string>
): Promise<ConfirmImportResponse> => {
  const { data } = await fovaeCoreApi.post<ConfirmImportResponse>(
    `/movements/imports/solucion-factible/${batchId}/confirm`,
    {
      concepts,
      ...(accountMappings && Object.keys(accountMappings).length > 0
        ? { accountMappings }
        : {}),
    }
  );

  return data;
};

