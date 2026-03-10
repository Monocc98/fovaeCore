import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, AlertCircle, ListChecks } from "lucide-react";
import { useParams } from "react-router";
import { useCategories } from "@/budget/hooks/useCategories";
import { confirmImportAction } from "@/home/actions/movements.actions";
import { useQuery } from "@tanstack/react-query";
import { getAccountsAction } from "@/accounts/actions/acounts.actions";

interface Concept {
  externalConceptKey: string;
  externalCategoryRaw: string;
  count: number;
  existingRule: {
    subsubcategoryId: string;
    confirmedCount: number;
  } | null;
}

interface ConceptMappingStepProps {
  batchId: string;
  concepts: Concept[];
  totalRows: number;
  detectedSections?: string[];
  transferCandidatesCount?: number;
  initialSectionAccountMap?: Record<string, string>;
  onBack: () => void;
  onSuccess: () => void;
}

type MappingState = {
  categoryId?: string;
  subcategoryId?: string;
  subsubcategoryId?: string;
};

export const ConceptMappingStep = ({
  batchId,
  concepts,
  totalRows,
  detectedSections = [],
  transferCandidatesCount = 0,
  initialSectionAccountMap = {},
  onBack,
  onSuccess,
}: ConceptMappingStepProps) => {
  const [mappings, setMappings] = useState<Record<string, MappingState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectionAccountMap, setSectionAccountMap] =
    useState<Record<string, string>>(initialSectionAccountMap);
  const [confirmResult, setConfirmResult] = useState<{
    insertedCount: number;
    transferCreatedCount: number;
  } | null>(null);

  const { companyId } = useParams<{ companyId?: string }>();

  const { categories, isLoading: loadingCats } = useCategories(companyId);

  const accountsQuery = useQuery({
    queryKey: ["accounts", companyId],
    queryFn: () => getAccountsAction(companyId!),
    enabled: !!companyId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const accountOptions = accountsQuery.data?.accounts ?? [];

  const subsubIndex = useMemo(() => {
    const index = new Map<
      string,
      { categoryId: string; subcategoryId: string }
    >();

    if (!categories) return index;

    for (const cat of categories as any[]) {
      const catId = cat.id ?? cat._id;
      const subs = cat.subcategories ?? [];

      for (const sub of subs) {
        const subId = sub.id ?? sub._id;
        const subsubs = sub.subsubcategories ?? [];

        for (const ss of subsubs) {
          const ssId = ss.id ?? ss._id;
          index.set(String(ssId), {
            categoryId: String(catId),
            subcategoryId: String(subId),
          });
        }
      }
    }

    return index;
  }, [categories]);

  useEffect(() => {
    const next: Record<string, MappingState> = {};

    concepts.forEach((concept) => {
      if (!concept.existingRule) return;

      const ssId = concept.existingRule.subsubcategoryId;
      const hit = subsubIndex.get(String(ssId));

      if (hit) {
        next[concept.externalConceptKey] = {
          categoryId: hit.categoryId,
          subcategoryId: hit.subcategoryId,
          subsubcategoryId: ssId,
        };
      } else {
        next[concept.externalConceptKey] = {
          subsubcategoryId: ssId,
        };
      }
    });

    setMappings(next);
  }, [concepts, subsubIndex]);

  const handleCategoryChange = (conceptKey: string, categoryId: string) => {
    setMappings((prev) => ({
      ...prev,
      [conceptKey]: {
        categoryId,
        subcategoryId: undefined,
        subsubcategoryId: undefined,
      },
    }));
    setError(null);
  };

  const handleSubcategoryChange = (
    conceptKey: string,
    subcategoryId: string
  ) => {
    setMappings((prev) => ({
      ...prev,
      [conceptKey]: {
        ...prev[conceptKey],
        subcategoryId,
        subsubcategoryId: undefined,
      },
    }));
    setError(null);
  };

  const handleSubsubChange = (conceptKey: string, subsubcategoryId: string) => {
    setMappings((prev) => ({
      ...prev,
      [conceptKey]: {
        ...prev[conceptKey],
        subsubcategoryId,
      },
    }));
    setError(null);
  };

  const isComplete = concepts.every(
    (concept) => !!mappings[concept.externalConceptKey]?.subsubcategoryId
  );

  const needsExplicitSectionMapping = detectedSections.length > 2;
  const sectionsMissingAccount = needsExplicitSectionMapping
    ? detectedSections.filter((section) => !sectionAccountMap[section])
    : [];
  const isSectionMappingComplete = sectionsMissingAccount.length === 0;

  const handleConfirm = async () => {
    if (!isComplete) {
      setError("Faltan subsubcategorias por asignar.");
      return;
    }

    if (!isSectionMappingComplete) {
      setError("Faltan cuentas por asignar para algunas secciones detectadas.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const conceptList = concepts.map((concept) => ({
        externalConceptKey: concept.externalConceptKey,
        subsubcategoryId:
          mappings[concept.externalConceptKey].subsubcategoryId!,
      }));

      const data = await confirmImportAction(batchId, conceptList);

      console.log(`${data.insertedCount} movimientos importados exitosamente`);
      setConfirmResult({
        insertedCount: data.insertedCount,
        transferCreatedCount: data.transferCreatedCount ?? 0,
      });
    } catch (err: any) {
      console.error("Error confirming import:", err);

      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Error al confirmar la importacion";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredConcepts = concepts.filter((concept) =>
    concept.externalCategoryRaw.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedCount = concepts.filter(
    (concept) => mappings[concept.externalConceptKey]?.subsubcategoryId
  ).length;
  const uniqueConcepts = concepts.length;

  const getSubcategoriesFor = (categoryId?: string) => {
    if (!categories || !categoryId) return [];
    const category = (categories as any[]).find(
      (cat) => String(cat.id ?? cat._id) === String(categoryId)
    );
    return category?.subcategories ?? [];
  };

  const getSubsubsFor = (categoryId?: string, subcategoryId?: string) => {
    const subcategories = getSubcategoriesFor(categoryId);
    const subcategory = (subcategories as any[]).find(
      (sub) => String(sub.id ?? sub._id) === String(subcategoryId)
    );
    return subcategory?.subsubcategories ?? [];
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          <div className="px-6 py-5 sm:px-8 sm:py-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 sm:h-14 sm:w-14">
                <ListChecks className="h-6 w-6 text-blue-500 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Revisar conceptos detectados
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Asigna la categoria interna antes de crear los movimientos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm">
                <span className="text-gray-600">Filas:</span>
                <span className="ml-2 font-bold text-gray-900">{totalRows}</span>
              </div>
              <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm">
                <span className="text-gray-600">Conceptos:</span>
                <span className="ml-2 font-bold text-gray-900">
                  {uniqueConcepts}
                </span>
              </div>
              <div className="rounded-lg bg-blue-100 px-3 py-2 text-sm">
                <span className="text-blue-700">Asignados:</span>
                <span className="ml-2 font-bold text-blue-900">
                  {completedCount}/{uniqueConcepts}
                </span>
              </div>
              {transferCandidatesCount > 0 && (
                <div className="rounded-lg bg-indigo-100 px-3 py-2 text-sm">
                  <span className="text-indigo-700">Transferencias:</span>
                  <span className="ml-2 font-bold text-indigo-900">
                    {transferCandidatesCount}
                  </span>
                </div>
              )}
            </div>

            {detectedSections.length > 0 && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-left">
                <p className="mb-2 text-xs text-gray-500">Secciones detectadas</p>
                <div className="flex flex-wrap gap-2">
                  {detectedSections.map((section) => (
                    <span
                      key={section}
                      className="rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {needsExplicitSectionMapping && (
              <div className="mt-3 max-h-44 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="mb-3 text-sm text-amber-800">
                  Se detectaron mas de 2 secciones. Asigna una cuenta por seccion
                  antes de confirmar.
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {detectedSections.map((section) => (
                    <div key={section}>
                      <label className="mb-1 block text-xs text-gray-600">
                        Cuenta para {section}
                      </label>
                      <select
                        value={sectionAccountMap[section] ?? ""}
                        onChange={(event) =>
                          setSectionAccountMap((prev) => ({
                            ...prev,
                            [section]: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        disabled={accountsQuery.isLoading}
                      >
                        <option value="">Seleccionar cuenta...</option>
                        {accountOptions.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <input
                type="text"
                placeholder="Buscar concepto..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {confirmResult && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-800">
                Importacion completada: <b>{confirmResult.insertedCount}</b>{" "}
                movimientos creados.
              </p>
              <p className="mt-1 text-sm text-green-800">
                Transferencias creadas: <b>{confirmResult.transferCreatedCount}</b>
              </p>
            </div>
          )}

          <div className="space-y-4">
            {filteredConcepts.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                No se encontraron conceptos
              </p>
            ) : (
              filteredConcepts.map((concept) => {
                const mapping = mappings[concept.externalConceptKey] || {};
                const subcategories = getSubcategoriesFor(mapping.categoryId);
                const subsubs = getSubsubsFor(
                  mapping.categoryId,
                  mapping.subcategoryId
                );

                return (
                  <div
                    key={concept.externalConceptKey}
                    className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
                  >
                    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="mb-1 text-xs text-gray-500">Concepto externo</p>
                        <p className="text-sm font-medium text-gray-900">
                          {concept.externalCategoryRaw}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-gray-500">Clave</p>
                        <p className="text-sm font-mono text-gray-700">
                          {concept.externalConceptKey}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-gray-500">Movimientos</p>
                        <div className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-900">
                          {concept.count}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-gray-500">Regla previa</p>
                        {concept.existingRule ? (
                          <div className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                            Regla encontrada
                          </div>
                        ) : (
                          <div className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            Sin regla
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-xs text-gray-500">
                          Categoria
                        </label>
                        <select
                          value={mapping.categoryId || ""}
                          onChange={(event) =>
                            handleCategoryChange(
                              concept.externalConceptKey,
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          disabled={loadingCats}
                        >
                          <option value="">
                            {loadingCats
                              ? "Cargando categorias..."
                              : "Seleccionar..."}
                          </option>
                          {!loadingCats &&
                            (categories as any[])?.map((category) => (
                              <option
                                key={category.id ?? category._id}
                                value={category.id ?? category._id}
                              >
                                {category.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs text-gray-500">
                          Subcategoria
                        </label>
                        <select
                          value={mapping.subcategoryId || ""}
                          onChange={(event) =>
                            handleSubcategoryChange(
                              concept.externalConceptKey,
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          disabled={!mapping.categoryId || loadingCats}
                        >
                          <option value="">
                            {!mapping.categoryId
                              ? "Selecciona categoria primero"
                              : "Seleccionar..."}
                          </option>
                          {subcategories.map((subcategory: any) => (
                            <option
                              key={subcategory.id ?? subcategory._id}
                              value={subcategory.id ?? subcategory._id}
                            >
                              {subcategory.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs text-gray-500">
                          Detalle
                        </label>
                        <select
                          value={mapping.subsubcategoryId || ""}
                          onChange={(event) =>
                            handleSubsubChange(
                              concept.externalConceptKey,
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          disabled={!mapping.subcategoryId || loadingCats}
                        >
                          <option value="">
                            {!mapping.subcategoryId
                              ? "Selecciona subcategoria primero"
                              : "Seleccionar..."}
                          </option>
                          {subsubs.map((subsub: any) => (
                            <option
                              key={subsub.id ?? subsub._id}
                              value={subsub.id ?? subsub._id}
                            >
                              {subsub.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onBack}
            disabled={!!confirmResult}
            className="flex-1 rounded-lg bg-gray-200 px-4 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-300 disabled:opacity-60"
          >
            Regresar
          </button>

          {confirmResult ? (
            <button
              onClick={onSuccess}
              className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700"
            >
              Cerrar
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Confirmando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Confirmar e importar movimientos</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
