import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { Budget } from "../../types";

export interface BudgetsByAccountResponse {
    budgets: Budget[];
}

export const getBudgetsAction = async( idAccount: string ):Promise<BudgetsByAccountResponse> => {
    const { data } = await fovaeCoreApi.get<BudgetsByAccountResponse>(`/budgets/account/${idAccount}`);

    return data;
}

export const getBudgetByIdAction = async( idBudget: string ):Promise<Budget> => {
    const { data } = await fovaeCoreApi.get<Budget>(`/budgets/${idBudget}`);

    return data;
}

export const createBudgetAction = async(payload: Budget): Promise<Budget> => {
    const body: Budget = {
        ...payload
    };

    const { data } = await fovaeCoreApi.post("/budgets", body);

    return data.budget;
}

export const updateBudgetAction = async(idBudget: string, payload: Budget) => {
    const body: Budget = {
        ...payload,
    }

    const { data } = await fovaeCoreApi.put<Budget>(`/budgets/${idBudget}`, body);
    return data;
}

export const deleteBudgetAction = async(idBudget: string) => {
    const { data } = await fovaeCoreApi.delete<Budget>(`budgets/${idBudget}`);
    
    return data;
}