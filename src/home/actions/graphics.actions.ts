import { fovaeCoreApi } from "@/api/fovaeCore.api";

export const getExpenseBudgetTreeAction = async (idCompany: string) => {
  const { data } = await fovaeCoreApi.get(
    `/graphics/expense-budget-tree/${idCompany}`
  );
  return data;
};
