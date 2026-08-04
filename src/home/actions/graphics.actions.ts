import { fovaeCoreApi } from "@/api/fovaeCore.api";

export const getExpenseBudgetTreeAction = async (idCompany: string, fiscalYearId?: string) => {
  const { data } = await fovaeCoreApi.get(
    `/graphics/expense-budget-tree/${idCompany}`,
    {
      params: fiscalYearId ? { fiscalYearId } : undefined
    }
  );
  return data;
};

export const getIncomeBudgetTreeAction = async (idCompany: string, fiscalYearId?: string) => {
  const { data } = await fovaeCoreApi.get(
    `/graphics/income-budget-tree/${idCompany}`,
    {
      params: fiscalYearId ? { fiscalYearId } : undefined
    }
  );
  return data;
};
