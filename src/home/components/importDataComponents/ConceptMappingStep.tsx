import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, AlertCircle, ListChecks } from "lucide-react";
import { useParams } from "react-router";
import { useCategories } from "@/budget/hooks/useCategories";
import { confirmImportAction } from "@/home/actions/movements.actions";

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
  onBack,
  onSuccess,
}: ConceptMappingStepProps) => {
  const [mappings, setMappings] = useState<Record<string, MappingState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { companyId } = useParams<{ companyId?: string }>();

  const { categories, isLoading: loadingCats } = useCategories(companyId);

  // 🔹 Indexar subsubcategorías -> { subsubId: { catId, subId } }
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

  // 🔹 Inicializar mappings con reglas existentes
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
        // Si no encontramos la subsub, al menos guardamos el id
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

  const handleConfirm = async () => {
    if (!isComplete) {
      setError("Faltan subsubcategorías por asignar.");
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
      onSuccess();
    } catch (err: any) {
      console.error("Error confirming import:", err);

      // ✅ saca el error real del backend (axios)
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Error al confirmar la importación";

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

  // Helpers para opciones de cada select
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
          Se han detectado varios conceptos externos. Asigna la categoría
          interna (Categoría → Subcategoría → Detalle) antes de crear los
          movimientos.
        </p>

        <div className="flex gap-4 justify-center text-sm">
          <div className="px-4 py-2 bg-gray-100 rounded-lg">
            <span className="text-gray-600">Total de filas:</span>
            <span className="ml-2 font-bold text-gray-900">{totalRows}</span>
          </div>
          <div className="px-4 py-2 bg-gray-100 rounded-lg">
            <span className="text-gray-600">Conceptos únicos:</span>
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
        </div>
      </div>

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

                  {/* 3 selects: Categoría / Subcategoría / Detalle */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Categoría */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-2">
                        Categoría
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
                            ? "Cargando categorías..."
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

                    {/* Subcategoría */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-2">
                        Subcategoría
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
                            ? "Selecciona categoría primero"
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

                    {/* Detalle / Subsubcategoría */}
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
                            ? "Selecciona subcategoría primero"
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
          className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Regresar
        </button>
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
      </div>
    </>
  );
};
