import { fovaeCoreApi } from "@/api/fovaeCore.api"
import type { HomeResponse } from "../../types";
import { normalizeIdDeep } from "@/helpers";


export const getHomeAction = async(fiscalYearId?: string):Promise<HomeResponse> => {
    const { data } = await fovaeCoreApi.get<HomeResponse>(`/home`, {
      params: fiscalYearId ? { fiscalYearId } : undefined
    });

    return normalizeIdDeep(data);
}

export const getBudgetVsActualAction = async (fiscalYearId?: string) => {

  const { data } = await fovaeCoreApi.get("/home/budget-vs-actual", {
    params: fiscalYearId ? { fiscalYearId } : undefined
  });
  return data;
};

export const getBucketsSummaryAction = async (fiscalYearId?: string) => {

  const { data } = await fovaeCoreApi.get("/home/buckets-summary", {
    params: fiscalYearId ? { fiscalYearId } : undefined
  });
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
  userId?: string,
  fiscalYearId?: string
): Promise<DividendsResponse> => {
  const { data } = await fovaeCoreApi.get<DividendsResponse>(
    `/home/dividends/group/${groupId}`,
    {
      params: {
        ...(userId ? { userId } : {}),
        ...(fiscalYearId ? { fiscalYearId } : {})
      }
    }
  );

  return data;
};
