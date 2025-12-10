import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { Movement } from "../../types";

export interface MovementsByAccountResponse {
    movements: Movement[];
    balance: number;
}

export interface ImportSolucionFactibleResponse {
  importBatchId: string;
  accountId: string;
  source: string;
  totalRows: number;
  concepts: Array<{
    externalConceptKey: string;
    externalCategoryRaw: string;
    count: number;
    existingRule: any | null;
  }>;
}


export const getMovementsAction = async( idAccount: string ):Promise<MovementsByAccountResponse> => {
    const { data } = await fovaeCoreApi.get<MovementsByAccountResponse>(`/movements/account/${idAccount}`);

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

export const importSolucionFactibleAction = async (
  accountId: string,
  file: File
): Promise<ImportSolucionFactibleResponse> => {
  const formData = new FormData();
  formData.append("file", file);          // nombre que espera Multer
  formData.append("accountId", accountId);

  // OJO: ruta relativa a TU API, SIN /api si ya lo pone el baseURL
  const { data } = await fovaeCoreApi.post<ImportSolucionFactibleResponse>(
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