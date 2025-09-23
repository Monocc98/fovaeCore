import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { Movement } from "../types/movement.interface";

export interface MovementsByAccountResponse {
    movements: Movement[];
    balance: number;
}

export const getMovementsAction = async( idAccount: string ):Promise<MovementsByAccountResponse> => {
    const { data } = await fovaeCoreApi.get<MovementsByAccountResponse>(`/movements/account/${idAccount}`);

    return data;
}