import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { FiscalYear } from "../types/fiscalYear.interface";

export const getFiscalYearsAction = async( idCompany: string ):Promise<FiscalYear[]> => {
    const { data } = await fovaeCoreApi.get<any>(`/fiscalYear/company/${idCompany}`);

    return data.fiscalYears;
}

export const getFiscalYearByIdAction = async( idFiscalYear: string ):Promise<FiscalYear[]> => {
    const { data } = await fovaeCoreApi.get<FiscalYear[]>(`/fiscalYear/${idFiscalYear}`);

    return data;
}

export const createFiscalYearAction = async(payload: FiscalYear): Promise<FiscalYear> => {
    const body: FiscalYear = {
        ...payload,
    };

    const { data } = await fovaeCoreApi.post("/fiscalYear", body);

    return data.fiscalYear;
}

export const updateFiscalYearAction = async(idFiscalYear: string, payload: FiscalYear): Promise<FiscalYear> => {
    const body: FiscalYear = {
        ...payload,
    }

    const { data } = await fovaeCoreApi.put<FiscalYear>(`/fiscalYear/${idFiscalYear}`, body);
    return data;
}

export const deleteFiscalYearAction = async(idFiscalYear: string) => {
    const { data } = await fovaeCoreApi.delete<FiscalYear>(`/fiscalYear/${idFiscalYear}`);
    
    return data;
}