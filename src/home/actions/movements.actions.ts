import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { Movement } from "../../types";

export interface MovementsByAccountResponse {
    movements: Movement[];
    balance: number;
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