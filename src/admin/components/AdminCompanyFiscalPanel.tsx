import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import {
  useAdminCompanyFiscal,
  useUpdateAdminCompanyFiscal,
} from "../hooks";
import type {
  CompanyFiscalProfile,
  FiscalEnvironment,
  HomeResponse,
} from "@/types";

type Props = { overlay: HomeResponse };

type CompanyOption = {
  id: string;
  name: string;
  groupName: string;
};

const emptyForm: CompanyFiscalProfile = {
  rfc: "",
  legalName: "",
  taxRegime: "",
  fiscalZipCode: "",
  fiscalEmail: "",
  defaultSeries: "",
  nextFolio: 1,
  fiscalEnvironment: "TEST",
  pacProvider: "",
};

export const AdminCompanyFiscalPanel = ({ overlay }: Props) => {
  const companies = useMemo<CompanyOption[]>(() => {
    const rows: CompanyOption[] = [];
    for (const group of overlay.groups) {
      for (const company of group.companies) {
        rows.push({
          id: company.id,
          name: company.name,
          groupName: group.name,
        });
      }
    }

    return rows.sort((a, b) =>
      `${a.groupName}/${a.name}`.localeCompare(`${b.groupName}/${b.name}`)
    );
  }, [overlay.groups]);

  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id ?? "");
  const companyQuery = useAdminCompanyFiscal(selectedCompanyId);
  const updateFiscalProfile = useUpdateAdminCompanyFiscal();
  const [form, setForm] = useState<CompanyFiscalProfile>(emptyForm);
  const [submitError, setSubmitError] = useState<unknown>(null);

  useEffect(() => {
    if (!selectedCompanyId && companies[0]?.id) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [selectedCompanyId, companies]);

  useEffect(() => {
    if (!companyQuery.data) return;
    setForm(companyQuery.data.fiscalProfile);
    setSubmitError(null);
  }, [companyQuery.data]);

  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) ?? null;
  const completeness = companyQuery.data?.completeness;

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCompanyId) return;

    try {
      setSubmitError(null);
      await updateFiscalProfile.mutateAsync({
        companyId: selectedCompanyId,
        payload: {
          ...form,
          nextFolio: Number(form.nextFolio) || 1,
        },
      });
      toast.success("Configuracion fiscal actualizada.");
    } catch (error) {
      setSubmitError(error);
      toast.error("No se pudo guardar la configuracion fiscal.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Empresas</h2>
            <p className="text-sm text-slate-500">Selecciona la empresa a configurar</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => companyQuery.refetch()}
            disabled={!selectedCompanyId || companyQuery.isFetching}
          >
            {companyQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="mt-4">
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.groupName} / {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 space-y-2">
          {companies.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => setSelectedCompanyId(company.id)}
              className={[
                "w-full rounded-2xl border p-4 text-left transition-colors",
                company.id === selectedCompanyId
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="font-medium">{company.name}</div>
              <div className={company.id === selectedCompanyId ? "text-sm text-slate-300" : "text-sm text-slate-500"}>
                {company.groupName}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Perfil Fiscal</h2>
            <p className="text-sm text-slate-500">
              Configuracion base por empresa para preparar timbrado y operacion fiscal.
            </p>
          </div>
          {selectedCompany && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-slate-700">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Empresa</div>
              <div className="mt-1 font-medium text-slate-950">{selectedCompany.name}</div>
              <div className="text-slate-600">{selectedCompany.groupName}</div>
            </div>
          )}
        </div>

        {!selectedCompanyId && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No hay empresas disponibles.
          </div>
        )}

        {selectedCompanyId && companyQuery.isLoading && (
          <div className="mt-6 space-y-4 animate-pulse">
            <div className="h-6 w-48 rounded bg-slate-200" />
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="h-10 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedCompanyId && companyQuery.isError && (
          <div className="mt-6">
            <QueryErrorState
              error={companyQuery.error}
              onRetry={() => {
                void companyQuery.refetch();
              }}
              title="No se pudo cargar el perfil fiscal"
            />
          </div>
        )}

        {selectedCompanyId && companyQuery.data && (
          <form className="mt-6 space-y-6" onSubmit={saveProfile}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  RFC
                </label>
                <Input
                  value={form.rfc}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, rfc: event.target.value.toUpperCase() }))
                  }
                  placeholder="XAXX010101000"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Razon Social
                </label>
                <Input
                  value={form.legalName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, legalName: event.target.value }))
                  }
                  placeholder="Nombre fiscal de la empresa"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Regimen Fiscal
                </label>
                <Input
                  value={form.taxRegime}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, taxRegime: event.target.value }))
                  }
                  placeholder="601"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Codigo Postal Fiscal
                </label>
                <Input
                  value={form.fiscalZipCode}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fiscalZipCode: event.target.value }))
                  }
                  placeholder="00000"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Email Fiscal
                </label>
                <Input
                  value={form.fiscalEmail}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fiscalEmail: event.target.value }))
                  }
                  placeholder="fiscal@empresa.com"
                  type="email"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  PAC Provider
                </label>
                <Input
                  value={form.pacProvider}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, pacProvider: event.target.value }))
                  }
                  placeholder="Ej. Solucion Factible / PAC elegido"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Serie Default
                </label>
                <Input
                  value={form.defaultSeries}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      defaultSeries: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="A"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Siguiente Folio
                </label>
                <Input
                  value={String(form.nextFolio)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      nextFolio: Number(event.target.value) || 1,
                    }))
                  }
                  min={1}
                  type="number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Ambiente Fiscal
                </label>
                <Select
                  value={form.fiscalEnvironment}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      fiscalEnvironment: value as FiscalEnvironment,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEST">TEST</SelectItem>
                    <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <FormErrorBanner error={submitError} />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Estado de completitud
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span
                  className={
                    completeness?.isReadyForInvoicing
                      ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                      : "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
                  }
                >
                  {completeness?.isReadyForInvoicing ? "Listo para facturacion" : "Perfil incompleto"}
                </span>
                {!completeness?.isReadyForInvoicing && (
                  <span className="text-sm text-slate-600">
                    Faltan: {(completeness?.missingFields ?? []).join(", ")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateFiscalProfile.isPending}>
                {updateFiscalProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar Configuracion Fiscal
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
