import { fovaeCoreApi } from "@/api/fovaeCore.api";
import { normalizeIdDeep } from "@/helpers";
import type {
  CompanyFiscalProfileResponse,
  UpdateCompanyFiscalProfilePayload,
} from "@/types";

export const getCompanyFiscalProfileAction = async (
  companyId: string
): Promise<CompanyFiscalProfileResponse> => {
  const { data } = await fovaeCoreApi.get<CompanyFiscalProfileResponse>(
    `/companies/${companyId}/fiscal-profile`
  );

  return normalizeIdDeep(data);
};

export const updateCompanyFiscalProfileAction = async (
  companyId: string,
  payload: UpdateCompanyFiscalProfilePayload
): Promise<CompanyFiscalProfileResponse> => {
  const { data } = await fovaeCoreApi.put<CompanyFiscalProfileResponse>(
    `/companies/${companyId}/fiscal-profile`,
    payload
  );

  return normalizeIdDeep(data);
};
