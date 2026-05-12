import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import {
  getCompanyFiscalProfileAction,
  updateCompanyFiscalProfileAction,
} from "../actions";
import type {
  CompanyFiscalProfileResponse,
  UpdateCompanyFiscalProfilePayload,
} from "@/types";

export const adminCompanyFiscalQueryKey = (companyId?: string) =>
  ["admin", "company-fiscal", companyId ?? "unknown"] as const;

export const useAdminCompanyFiscal = (
  companyId?: string
): UseQueryResult<CompanyFiscalProfileResponse> =>
  useQuery({
    queryKey: adminCompanyFiscalQueryKey(companyId),
    queryFn: () => getCompanyFiscalProfileAction(companyId!),
    enabled: Boolean(companyId),
  });

export const useUpdateAdminCompanyFiscal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      payload,
    }: {
      companyId: string;
      payload: UpdateCompanyFiscalProfilePayload;
    }) => updateCompanyFiscalProfileAction(companyId, payload),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(adminCompanyFiscalQueryKey(variables.companyId), response);
    },
  });
};
