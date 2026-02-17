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
    (c) => mappings[c.externalConceptKey]?.subsubcategoryId
  ).length;
  const uniqueConcepts = concepts.length;

  const getSubcategoriesFor = (categoryId?: string) => {
    if (!categories || !categoryId) return [];
    const cat = (categories as any[]).find(
      (c) => String(c.id ?? c._id) === String(categoryId)
    );
    return cat?.subcategories ?? [];
  };

  const getSubsubsFor = (categoryId?: string, subcategoryId?: string) => {
    const subs = getSubcategoriesFor(categoryId);
    const sub = (subs as any[]).find(
      (s) => String(s.id ?? s._id) === String(subcategoryId)
    );
    return sub?.subsubcategories ?? [];
  };

  return (
    <>
      <div className="p-8 text-center border-b border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
          <ListChecks className="w-8 h-8 text-blue-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Revisar conceptos detectados
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Se detectaron conceptos externos. Asigna la categoria interna antes de
          crear los movimientos.
        </p>

        <div className="flex gap-4 justify-center text-sm flex-wrap">
          <div className="px-4 py-2 bg-gray-100 rounded-lg">
            <span className="text-gray-600">Total de filas:</span>
            <span className="ml-2 font-bold text-gray-900">{totalRows}</span>
          </div>
          <div className="px-4 py-2 bg-gray-100 rounded-lg">
            <span className="text-gray-600">Conceptos unicos:</span>
            <span className="ml-2 font-bold text-gray-900">
              {uniqueConcepts}
            </span>
          </div>
          <div className="px-4 py-2 bg-blue-100 rounded-lg">
            <span className="text-blue-700">Asignados:</span>
            <span className="ml-2 font-bold text-blue-900">
              {completedCount}/{uniqueConcepts}
            </span>
          </div>
          {transferCandidatesCount > 0 && (
            <div className="px-4 py-2 bg-indigo-100 rounded-lg">
              <span className="text-indigo-700">Transferencias candidatas:</span>
              <span className="ml-2 font-bold text-indigo-900">
                {transferCandidatesCount}
              </span>
            </div>
          )}
        </div>

        {detectedSections.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
            <p className="text-xs text-gray-500 mb-2">Secciones detectadas</p>
            <div className="flex flex-wrap gap-2">
              {detectedSections.map((section) => (
                <span
                  key={section}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700"
                >
                  {section}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {needsExplicitSectionMapping && (
        <div className="px-8 py-4 border-b border-gray-200 bg-amber-50">
          <p className="text-sm text-amber-800 mb-3">
            Se detectaron mas de 2 secciones. Asigna una cuenta por seccion
            antes de confirmar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {detectedSections.map((section) => (
              <div key={section}>
                <label className="text-xs text-gray-600 block mb-1">
                  Cuenta para {section}
                </label>
                <select
                  value={sectionAccountMap[section] ?? ""}
                  onChange={(e) =>
                    setSectionAccountMap((prev) => ({
                      ...prev,
                      [section]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  disabled={accountsQuery.isLoading}
                >
                  <option value="">Seleccionar cuenta...</option>
                  {accountOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-8 py-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Buscar concepto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div
        className="px-8 py-6 overflow-y-auto"
        style={{ maxHeight: "calc(90vh - 380px)" }}
      >
        {confirmResult && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Importacion completada: <b>{confirmResult.insertedCount}</b>{" "}
              movimientos creados.
            </p>
            <p className="text-sm text-green-800 mt-1">
              Transferencias creadas: <b>{confirmResult.transferCreatedCount}</b>
            </p>
          </div>
        )}

        <div className="space-y-4">
          {filteredConcepts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
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
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="grid grid-cols-4 gap-4 items-center mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Concepto externo
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {concept.externalCategoryRaw}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Clave</p>
                      <p className="text-sm font-mono text-gray-700">
                        {concept.externalConceptKey}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Movimientos</p>
                      <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-900">
                        {concept.count}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Regla previa</p>
                      {concept.existingRule ? (
                        <div className="inline-block px-3 py-1 bg-purple-100 rounded-full text-xs font-medium text-purple-700">
                          Regla encontrada
                        </div>
                      ) : (
                        <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                          Sin regla
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-2">
                        Categoria
                      </label>
                      <select
                        value={mapping.categoryId || ""}
                        onChange={(e) =>
                          handleCategoryChange(
                            concept.externalConceptKey,
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        disabled={loadingCats}
                      >
                        <option value="">
                          {loadingCats
                            ? "Cargando categorias..."
                            : "Seleccionar..."}
                        </option>
                        {!loadingCats &&
                          (categories as any[])?.map((cat) => (
                            <option
                              key={cat.id ?? cat._id}
                              value={cat.id ?? cat._id}
                            >
                              {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 block mb-2">
                        Subcategoria
                      </label>
                      <select
                        value={mapping.subcategoryId || ""}
                        onChange={(e) =>
                          handleSubcategoryChange(
                            concept.externalConceptKey,
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        disabled={!mapping.categoryId || loadingCats}
                      >
                        <option value="">
                          {!mapping.categoryId
                            ? "Selecciona categoria primero"
                            : "Seleccionar..."}
                        </option>
                        {subcategories.map((sub: any) => (
                          <option
                            key={sub.id ?? sub._id}
                            value={sub.id ?? sub._id}
                          >
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 block mb-2">
                        Detalle
                      </label>
                      <select
                        value={mapping.subsubcategoryId || ""}
                        onChange={(e) =>
                          handleSubsubChange(
                            concept.externalConceptKey,
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        disabled={!mapping.subcategoryId || loadingCats}
                      >
                        <option value="">
                          {!mapping.subcategoryId
                            ? "Selecciona subcategoria primero"
                            : "Seleccionar..."}
                        </option>
                        {subsubs.map((ss: any) => (
                          <option key={ss.id ?? ss._id} value={ss.id ?? ss._id}>
                            {ss.name}
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
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex gap-3">
        <button
          onClick={onBack}
          disabled={!!confirmResult}
          className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-60"
        >
          Regresar
        </button>

        {confirmResult ? (
          <button
            onClick={onSuccess}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Cerrar
          </button>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar e importar movimientos</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
};
