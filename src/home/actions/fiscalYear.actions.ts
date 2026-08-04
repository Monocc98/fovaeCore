import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { FiscalYear, FiscalYearResponse, FiscalYearsByCompany } from "../../types";

export const getFiscalYearsByIdCompanyAction = async( idCompany: string ):Promise<FiscalYearResponse[]> => {
    const { data } = await fovaeCoreApi.get<FiscalYearsByCompany>(`/fiscalYearCompany/${idCompany}`);

    return data.fiscalYears_Companies ?? [];
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

export const getFiscalYearsAction = async(): Promise<FiscalYear[]> => {
    const { data } = await fovaeCoreApi.get<{ fiscalYears: FiscalYear[] }>("/fiscalYear");
    return data.fiscalYears ?? [];
}