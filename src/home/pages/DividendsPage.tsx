import { getGroupDividendsAction } from "@/home/actions/get-home.action";
import { formatCurrency } from "@/helpers/formatCurrency.helper";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Landmark } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";

const formatDate = (value?: string) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
};

export const DividendsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get("userId") ?? undefined;
  const backTo = (location.state as any)?.backTo as string | undefined;

  const dividendsQuery = useQuery({
    queryKey: ["groupDividends", groupId, selectedUserId],
    queryFn: () => getGroupDividendsAction(groupId!, selectedUserId),
    enabled: !!groupId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const data = dividendsQuery.data;
  const companies = data?.companies ?? [];
  const familyExpenses = data?.familyExpenses ?? [];
  const partners = data?.partners ?? [];
  const groupName = data?.group?.name ?? "Grupo";
  const userName = data?.user?.name ?? "Socio sin seleccionar";
  const canInspectAll = data?.permissions?.canInspectAll ?? false;
  const summary = {
    grossDividends: data?.summary?.grossDividends ?? 0,
    familyDiscounts: data?.summary?.familyDiscounts ?? 0,
    remainingDividends: data?.summary?.remainingDividends ?? 0,
  };

  const handleBack = () => {
    if (backTo) {
      navigate(backTo, { replace: true });
    } else if (groupId) {
      navigate(`/group/${groupId}`, { replace: true });
    } else {
      navigate(-1);
    }
  };

  const handlePartnerChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("userId", value);
    } else {
      next.delete("userId");
    }
    setSearchParams(next, { replace: true });
  };

  if (dividendsQuery.isLoading) {
    return <div className="p-6 text-sm text-gray-500">Cargando dividendos...</div>;
  }

  if (dividendsQuery.isError || !data) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar los dividendos.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-950">Dividendos</h1>
              <p className="text-sm text-gray-500">
                {groupName} / {userName}
              </p>
            </div>
          </div>
        </div>

        {canInspectAll && (
          <div className="min-w-64">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Socio
            </label>
            <select
              value={data.user?.id ?? ""}
              onChange={(event) => handlePartnerChange(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name ?? partner.email ?? "Socio"}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Dividendos brutos</p>
          <p className="mt-2 text-2xl font-semibold text-gray-950">
            {formatCurrency(summary.grossDividends)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Gastos Family</p>
          <p className="mt-2 text-2xl font-semibold text-rose-700">
            {formatCurrency(summary.familyDiscounts)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Dividendos restantes</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {formatCurrency(summary.remainingDividends)}
          </p>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-950">Utilidades por empresa</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Empresa</th>
                <th className="px-5 py-3">Año fiscal</th>
                <th className="px-5 py-3 text-right">Utilidad</th>
                <th className="px-5 py-3 text-right">Porcentaje</th>
                <th className="px-5 py-3 text-right">Dividendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {company.name ?? "Empresa"}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {company.fiscalYear?.name ?? "Sin año activo"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {formatCurrency(company.utilityTotal ?? 0)}
                  </td>
                  <td className="px-5 py-3 text-right">{company.dividendShare ?? 0}%</td>
                  <td className="px-5 py-3 text-right font-medium">
                    {formatCurrency(company.grossDividend ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-950">Gastos descontados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Empresa</th>
                <th className="px-5 py-3">Concepto</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {familyExpenses.length > 0 ? (
                familyExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-5 py-3 text-gray-600">{formatDate(expense.occurredAt)}</td>
                    <td className="px-5 py-3 text-gray-900">
                      {expense.company?.name ?? "Empresa"}
                    </td>
                    <td className="px-5 py-3 text-gray-900">{expense.description}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {[expense.categoryName, expense.subcategoryName, expense.subsubcategoryName]
                        .filter(Boolean)
                        .join(" / ")}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-rose-700">
                      {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-8 text-center text-gray-500" colSpan={5}>
                    No hay gastos Family asignados a este socio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
