export type FiscalEnvironment = "TEST" | "PRODUCTION";

export interface CompanyFiscalProfile {
  rfc: string;
  legalName: string;
  taxRegime: string;
  fiscalZipCode: string;
  fiscalEmail: string;
  defaultSeries: string;
  nextFolio: number;
  fiscalEnvironment: FiscalEnvironment;
  pacProvider: string;
}

export interface CompanyFiscalProfileResponse {
  company: {
    id: string;
    name: string;
  };
  fiscalProfile: CompanyFiscalProfile;
  completeness: {
    isReadyForInvoicing: boolean;
    missingFields: string[];
  };
}

export interface UpdateCompanyFiscalProfilePayload extends CompanyFiscalProfile {}
