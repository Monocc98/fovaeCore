import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { HomeResponse } from "../../types";
import { normalizeIdDeep } from "@/helpers";


export const getHomeAction = async():Promise<HomeResponse> => {
    const { data } = await fovaeCoreApi.get<HomeResponse>(`/home`);

    return normalizeIdDeep(data);
}

export const getBudgetVsActualAction = async () => {

  const { data } = await fovaeCoreApi.get("/home/budget-vs-actual");
  return data;
};

export const getBucketsSummaryAction = async () => {

  const { data } = await fovaeCoreApi.get("/home/buckets-summary");
  return data;
};

export type DividendCompany = {
  id: string;
  name: string;
  fiscalYear: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  utilityTotal: number;
  dividendShare: number;
  grossDividend: number;
};

export type FamilyDividendExpense = {
  id: string;
  company: {
    id: string;
    name: string;
  };
  description: string;
  comments?: string;
  occurredAt: string;
  amount: number;
  categoryName?: string;
  subcategoryName?: string;
  subsubcategoryName?: string;
};

export type DividendsResponse = {
  group: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  permissions: {
    canInspectAll: boolean;
  };
  partners: {
    id: string;
    name: string;
    email: string;
    companiesCount: number;
  }[];
  companies: DividendCompany[];
  familyExpenses: FamilyDividendExpense[];
  summary: {
    grossDividends: number;
    familyDiscounts: number;
    remainingDividends: number;
  };
};

export const getGroupDividendsAction = async (
  groupId: string,
  userId?: string
): Promise<DividendsResponse> => {
  const { data } = await fovaeCoreApi.get<DividendsResponse>(
    `/home/dividends/group/${groupId}`,
    {
      params: userId ? { userId } : undefined,
    }
  );

  return data;
};
