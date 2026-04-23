import { formatCurrency } from "@/helpers";

export interface Summary {
    ingresos: number;
    egresosFijos: number;
    egresosVariables: number;
    family: number;
    total: number;
    totalWithFamily?: number;
    totalWithoutFamily?: number;
    unmappedCount?: number;
}

export interface SummaryCompany {
    _id: string;
    name: string;
    summary: Summary;
}

export const CategorySummarySkeleton = () => (
    <div className="animate-pulse overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="p-6">
            <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-4 w-20 justify-self-end rounded bg-gray-200" />
                <div className="h-4 w-20 justify-self-end rounded bg-gray-200" />
            </div>
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="grid grid-cols-3 items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-gray-200" />
                            <div className="h-4 w-36 rounded bg-gray-200" />
                        </div>
                        <div className="h-4 w-24 justify-self-end rounded bg-gray-200" />
                        <div className="h-4 w-16 justify-self-end rounded bg-gray-200" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

interface Props {
    title?: string;
    summary: Summary;
    companies?: SummaryCompany[];
    showCompaniesBreakdown?: boolean;
    includeFamily?: boolean;
}

const pct = (value: number, ingresos: number) =>
    ingresos > 0 ? `${((value / ingresos) * 100).toFixed(1)}%` : "N/A";

const getDisplayTotal = (summary: Summary, includeFamily: boolean) =>
    includeFamily
        ? summary.totalWithFamily ?? summary.total
        : summary.totalWithoutFamily ?? summary.total - summary.family;

export const CategorySummaryTable = ({
    summary,
    companies = [],
    showCompaniesBreakdown = false,
    includeFamily = true,
}: Props) => {
    const displayTotal = getDisplayTotal(summary, includeFamily);

    const rows = [
        {
            key: "INCOME",
            label: "Ingresos",
            dot: "bg-green-500",
            hover: "hover:bg-green-50",
            text: "text-green-600",
            value: summary.ingresos,
            percentage: "100%",
        },
        {
            key: "FIXED_EXPENSE",
            label: "Egresos Fijos",
            dot: "bg-red-500",
            hover: "hover:bg-red-50",
            text: "text-red-600",
            value: summary.egresosFijos,
            percentage: pct(summary.egresosFijos, summary.ingresos),
        },
        {
            key: "VARIABLE_EXPENSE",
            label: "Egresos Variables",
            dot: "bg-orange-500",
            hover: "hover:bg-orange-50",
            text: "text-orange-600",
            value: summary.egresosVariables,
            percentage: pct(summary.egresosVariables, summary.ingresos),
        },
        {
            key: "FAMILY",
            label: "Family",
            dot: "bg-slate-500",
            hover: "hover:bg-slate-50",
            text: "text-secondary",
            value: summary.family,
            percentage: pct(summary.family, summary.ingresos),
        },
    ].filter((row) => includeFamily || row.key !== "FAMILY");

    const totalDot = "bg-slate-500";
    const totalText = "text-slate-900";

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Categoria</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Monto</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Porcentaje</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {rows.map((r) => (
                            <tr key={r.key} className={`${r.hover} transition-colors`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-3 h-3 rounded-full ${r.dot}`} />
                                        <span className="font-medium text-gray-900">{r.label}</span>
                                    </div>
                                </td>
                                <td className={`px-6 py-4 text-right font-semibold ${r.text}`}>
                                    {formatCurrency(r.value)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-600">
                                    {r.percentage}
                                </td>
                            </tr>
                        ))}

                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                            <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${totalDot}`} />
                                    <span className="text-gray-900">Balance Total</span>
                                </div>
                            </td>
                            <td className={`px-6 py-4 text-right text-lg ${totalText}`}>
                                {formatCurrency(displayTotal)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-600">
                                {pct(displayTotal, summary.ingresos)}
                            </td>
                        </tr>

                        {!!summary.unmappedCount && summary.unmappedCount > 0 && (
                            <tr className="bg-yellow-50">
                                <td className="px-6 py-3 text-sm text-yellow-800" colSpan={3}>
                                    Hay {summary.unmappedCount} movimientos sin bucket.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showCompaniesBreakdown && companies.length > 0 && (
                <div className="border-t border-gray-200">
                    <div className="px-6 py-4 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-800">Desglose por empresa</h3>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {companies.map((c) => {
                            const companyTotal = getDisplayTotal(c.summary, includeFamily);

                            return (
                                <div key={c._id} className="px-6 py-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="font-semibold text-gray-900">{c.name}</div>
                                        <div className="text-sm font-semibold text-slate-900">
                                            {formatCurrency(companyTotal)}
                                        </div>
                                    </div>

                                    <div className={`grid grid-cols-2 ${includeFamily ? "md:grid-cols-4" : "md:grid-cols-3"} gap-3 text-sm`}>
                                        <div>
                                            <div className="text-gray-500">Ingresos</div>
                                            <div className="font-semibold text-green-600">{formatCurrency(c.summary.ingresos)}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500">Egresos Fijos</div>
                                            <div className="font-semibold text-red-600">{formatCurrency(c.summary.egresosFijos)}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500">Egresos Variables</div>
                                            <div className="font-semibold text-orange-600">{formatCurrency(c.summary.egresosVariables)}</div>
                                        </div>
                                        {includeFamily && (
                                            <div>
                                                <div className="text-gray-500">Family</div>
                                                <div className="font-semibold text-secondary">{formatCurrency(c.summary.family)}</div>
                                            </div>
                                        )}
                                    </div>

                                    {!!c.summary.unmappedCount && c.summary.unmappedCount > 0 && (
                                        <div className="mt-3 text-xs text-yellow-700">
                                            Movimientos sin bucket: {c.summary.unmappedCount}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
