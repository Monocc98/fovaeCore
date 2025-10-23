import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { Account, AccountsResponse } from "../types/account.interface";

export const getAccountsAction = async(idCompany: string):Promise<AccountsResponse> => {
    const { data } = await fovaeCoreApi.get<AccountsResponse>(`/accounts/${idCompany}`);

    return {
        ...data
    };
}

export const createAccountAction = async(payload: Account): Promise<Account> => {
    const body: Account = {
        ...payload,
    };

    const { data } = await fovaeCoreApi.post("/accounts", body);

    return data.account;
}

export const updateAccountAction = async(idAccount: string, payload: Account): Promise<Account> => {
    const body: Account = {
        ...payload,
    }

    const { data } = await fovaeCoreApi.put<Account>(`/accounts/${idAccount}`, body);
    return data;
}

export const deleteAccountAction = async(idAccount: string) => {
    const { data } = await fovaeCoreApi.delete<Account>(`accounts/${idAccount}`);
    
    return data;
}