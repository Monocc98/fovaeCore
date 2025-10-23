import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { getLevelBadge, getScopeBadge } from "@/helpers";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategoryAction,
  createSubcategoryAction,
  createSubsubcategoryAction,
  deleteCategoryAction,
  deleteSubcategoryAction,
  deleteSubsubcategoryAction,
  getCategoriesOverloadAction,
  updateCategoryAction,
  updateSubcategoryAction,
  updateSubsubcategoryAction,
} from "@/home/actions/categories.actions";

import { DeleteCategoryAlert } from "../components/alerts/DeleteCategoryAlert";
import { useLocation, useNavigate, useParams } from "react-router";
import type { CategoriesResponse } from "@/home/types/companiesResponse.interface";
import type { Category } from "@/home/types/categories.interfaces";

type Level = "category" | "subcategory" | "subsubcategory";
type Scope = "COMPANY" | "ACCOUNT";
type DeletePayload = { id: string; level: RowLevel };

interface CategoryFormValues {
  name: string;
  level: Level;
  parentId?: string;
  scope: Scope;
  id?: string;
  type?: string;
}

type RowLevel = "category" | "subcategory" | "subsubcategory";
export type Row = {
  id: string;
  level: RowLevel;
  name: string;
  type?: string;
  path: string; // "Cat → Subcat → Detalle"
  scope: "COMPANY" | "ACCOUNT" | string;
  catId: string;
  subId?: string;
};

export const CategoriesPage = () => {
  const [categoryToDelete, setCategoryToDelete] = useState<Row | null>(null);
  const [showForm, setShowForm] = useState(false);

  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const location = useLocation();
  const { companyId, idAccount } = useParams<{
    companyId: string;
    idAccount: string;
  }>();

  const backTo = (location.state as any)?.backTo as string | undefined;

  const [editingId, setEditingId] = useState<string | null>(null);

  const categoriesQuery = useQuery<CategoriesResponse>({
    queryKey: ["categories", companyId],
    queryFn: () => getCategoriesOverloadAction(companyId!),
    enabled: !!companyId,
  });

  const companyName = categoriesQuery.data?.company?.name;

  const parentCategories: Category[] =
    categoriesQuery.data?.company?.categories ?? [];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    // formState: { errors },
  } = useForm<CategoryFormValues>({
    defaultValues: {
      name: "",
      level: "category",
      scope: "COMPANY",
      parentId: "",
      type: "",
    },
  });

  const level = watch("level");
  // const scope = watch("scope");

  const rows: Row[] = useMemo(() => {
    const acc: Row[] = [];

    for (const cat of parentCategories) {
      // Nivel 1
      acc.push({
        id: cat._id,
        level: "category",
        name: cat.name,
        path: cat.name,
        scope: cat.scope,
        catId: cat._id,
        type: cat.type,
      });

      for (const sub of cat.subcategories ?? []) {
        // Nivel 2
        acc.push({
          id: sub._id,
          level: "subcategory",
          name: sub.name,
          path: `${cat.name} → ${sub.name}`,
          scope: sub.scope,
          catId: cat._id,
          subId: sub._id,
        });

        for (const leaf of sub.subsubcategories ?? []) {
          // Nivel 3
          acc.push({
            id: leaf._id,
            level: "subsubcategory",
            name: leaf.name,
            path: `${cat.name} → ${sub.name} → ${leaf.name}`,
            scope: leaf.scope,
            catId: cat._id,
            subId: sub._id,
          });
        }
      }
    }

    return acc;
  }, [parentCategories]);

  const parentOptions = useMemo(() => {
    if (level === "subcategory") {
      // padre debe ser categoría (nivel 1)
      return parentCategories.map((c) => ({ id: c._id, name: c.name }));
    }
    if (level === "subsubcategory") {
      // padre debe ser subcategoría (nivel 2)
      const subs = parentCategories.flatMap((c) => c.subcategories ?? []);
      return subs.map((s) => ({ id: s._id, name: s.name }));
    }
    return []; // nivel category no requiere padre
  }, [level, parentCategories]);

  // --- Filtros UI ---
  const [searchTerm, setSearchTerm] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "COMPANY" | "ACCOUNT">(
    "ALL"
  );

  const [catFilter, setCatFilter] = useState<string>(""); // categoría padre
  const [subFilter, setSubFilter] = useState<string>(""); // subcategoría

  // opciones de selects:
  const catOptions = useMemo(
    () => parentCategories.map((c) => ({ id: c._id, name: c.name })),
    [parentCategories]
  );

  const subOptions = useMemo(() => {
    if (!catFilter) return [];
    const cat = parentCategories.find((c) => c._id === catFilter);
    return (cat?.subcategories ?? []).map((s) => ({ id: s._id, name: s.name }));
  }, [catFilter, parentCategories]);

  // al cambiar categoría, resetea subcategoría
  const onChangeCatFilter = (v: string) => {
    setCatFilter(v);
    setSubFilter(""); // reset dependiente
  };

  // --- Filtrado de filas para tabla ---
  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return rows.filter((r) => {
      const matchText =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.path.toLowerCase().includes(q) ||
        (r.type?.toLowerCase().includes(q) ?? false);

      const matchScope = scopeFilter === "ALL" || r.scope === scopeFilter;
      const matchCat = !catFilter || r.catId === catFilter;
      const matchSub = !subFilter || r.subId === subFilter;

      return matchText && matchScope && matchCat && matchSub;
    });
  }, [rows, searchTerm, scopeFilter, catFilter, subFilter]);

  const createMut = useMutation({
    mutationFn: async (payload: CategoryFormValues) => {
      // adapta el payload a tu backend si usa claves distintas
      if (payload.level === "category") {
        return createCategoryAction({
          name: payload.name,
          scope: payload.scope,
          type: payload.type,
          company: companyId!,
        } as any);
      } else if (payload.level === "subcategory") {
        return createSubcategoryAction({
          name: payload.name,
          scope: payload.scope,
          parent: payload.parentId,
          company: companyId!,
        } as any);
      } else if (payload.level === "subsubcategory") {
        return createSubsubcategoryAction({
          name: payload.name,
          scope: payload.scope,
          parent: payload.parentId,
          company: companyId!,
        } as any);
      }
    },
    onSuccess: () => {
      // refresca las categorías
      queryClient.invalidateQueries({
        queryKey: ["categories", companyId],
      });
      reset();
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: CategoryFormValues;
    }) => {
      if (data.level === "category") {
        return updateCategoryAction(id, {
          name: data.name,
          scope: data.scope,
          type: data.type,
          company: companyId!,
        } as any);
      }

      if (data.level === "subcategory") {
        return updateSubcategoryAction(id, {
          name: data.name,
          scope: data.scope,
          parent: data.parentId, // padre = category
          company: companyId!,
        } as any);
      }

      // subsubcategory
      return updateSubsubcategoryAction(id, {
        name: data.name,
        scope: data.scope,
        parent: data.parentId, // padre = subcategory
        company: companyId!,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories", companyId],
      });
      reset();
      setEditingId(null);
    },
  });

  const deleteMut = useMutation<void, unknown, DeletePayload>({
    mutationFn: async ({ id, level }) => {
      if (level === "category") {
        await deleteCategoryAction(id);
        return; // explícito: void
      }
      if (level === "subcategory") {
        await deleteSubcategoryAction(id);
        return;
      }
      await deleteSubsubcategoryAction(id);
      // sin return -> void
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories", companyId],
      });
      reset;
      setCategoryToDelete(null);
      setEditingId(null);
      setShowForm(false);
    },
  });

  const openCreate = () => {
    setEditingId(null);
    reset({
      name: "",
      level: "category",
      scope: "COMPANY",
      parentId: "",
      type: "",
    });
    setShowForm(true);
  };

  const openEdit = (row: Row) => {
    // Preefill como ya lo hacías:
    if (row.level === "category") {
      reset({
        name: row.name,
        level: "category",
        scope: (row.scope as Scope) ?? "COMPANY",
        parentId: "",
        type: row.type,
      });
    } else if (row.level === "subcategory") {
      reset({
        name: row.name,
        level: "subcategory",
        scope: (row.scope as Scope) ?? "COMPANY",
        parentId: row.catId,
      });
    } else {
      reset({
        name: row.name,
        level: "subsubcategory",
        scope: (row.scope as Scope) ?? "COMPANY",
        parentId: row.subId,
      });
    }
    setEditingId(row.id);
    setShowForm(true);
  };

  // const handleCancelForm = () => {
  //   reset();
  //   setEditingId(null);
  //   setShowForm(false);
  // };

  const handleDeleteClick = (category: Row) => {
    setCategoryToDelete(category);
  };

  const cancelDelete = () => setCategoryToDelete(null);

  const confirmDelete = () => {
    if (!categoryToDelete) return;
    deleteMut.mutate({
      id: categoryToDelete.id,
      level: categoryToDelete.level,
    });
  };
  const onSubmit = (form: CategoryFormValues) => {
    // validación: si no es "category", parentId es requerido
    if (form.level !== "category" && !form.parentId) {
      // puedes usar setError si quieres pintar error
      return;
    }

    if (editingId) {
      updateMut.mutate({ id: editingId, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  const handleEdit = (row: Row) => {
    openEdit(row);
    // // Prefill según nivel y jerarquía
    // if (row.level === "category") {
    //   reset({
    //     name: row.name,
    //     level: "category",
    //     scope: (row.scope as Scope) ?? "COMPANY",
    //     parentId: "",
    //     type: row.type,
    //   });
    // } else if (row.level === "subcategory") {
    //   reset({
    //     name: row.name,
    //     level: "subcategory",
    //     scope: (row.scope as Scope) ?? "COMPANY",
    //     parentId: row.catId, // su padre es la categoría
    //   });
    // } else {
    //   // subsubcategory
    //   reset({
    //     name: row.name,
    //     level: "subsubcategory",
    //     scope: (row.scope as Scope) ?? "COMPANY",
    //     parentId: row.subId, // su padre es la subcategoría
    //   });
    // }
    // setEditingId(row.id);
  };

  const handleBack = () => {
    if (backTo) {
      navigate(backTo, { replace: true }); // regresa exactamente a la vista anterior (tabs/filtros incluidos)
    } else if (companyId) {
      // fallback razonable a la vista de la empresa con la cuenta activa marcada
      navigate(`/company/${companyId}?a=${idAccount}`, { replace: true });
    } else {
      navigate(-1); // último recurso
    }
  };

  return (
    <>
      <div className="max-w-6xl py-6 mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Category Management Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Administrar Categorías
              </h2>
              <p className="text-gray-600 mt-1">
                Gestiona las categorías de movimientos financieros para{" "}
                {companyName}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Volver al Dashboard
              </button>
              <button
                onClick={openCreate}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Categoría</span>
              </button>
            </div>
          </div>

          {/* Category Form */}
          {showForm && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="bg-gray-50 rounded-lg p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {/* {editingCategory ? "Editar Categoría" : "Nueva Categoría"} */}
              </h3>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="Nombre de la categoría..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel
                  </label>
                  <select
                    {...register("level")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="category">Categoría</option>
                    <option value="subcategory">Subcategoría</option>
                    <option value="subsubcategory">Detalle</option>
                  </select>
                </div>

                {level !== "category" ? (
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría Padre
                    </label>
                    <select
                      {...register("parentId")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Seleccionar...</option>
                      {parentOptions.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo
                    </label>
                    <select
                      {...register("type")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Seleccionar...</option>
                      <option key="income" value="INCOME">
                        Ingreso
                      </option>
                      <option key="expense" value="EXPENSE">
                        Egreso
                      </option>
                    </select>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alcance
                  </label>
                  <select
                    {...register("scope")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="COMPANY">Empresa</option>
                    <option value="ACCOUNT">Cuenta</option>
                  </select>
                </div>

                <div className="col-span-1 flex items-end">
                  <button
                    type="submit"
                    // disabled={!categoryFormData.name}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {editingId ? "Actualizar" : "Agregar"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <select
                value={scopeFilter}
                onChange={(e) =>
                  setScopeFilter(
                    e.target.value as "ALL" | "COMPANY" | "ACCOUNT"
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="ALL">Todos los alcances</option>
                <option value="COMPANY">Solo Empresa</option>
                <option value="ACCOUNT">Solo Cuenta</option>
              </select>
            </div>

            <select
              value={catFilter}
              onChange={(e) => onChangeCatFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Todas las categorías</option>
              {catOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={subFilter}
              onChange={(e) => setSubFilter(e.target.value)}
              disabled={!catFilter}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">Todas las subcategorías</option>
              {subOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="text-sm text-gray-500">
              {filteredRows.length} categorías encontradas
            </div>
          </div>

          {/* Categories Table */}
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alcance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRows.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div className="font-medium">{category.path}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getLevelBadge(category.level)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getScopeBadge(category.scope)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {categoryToDelete && (
        <DeleteCategoryAlert
          category={categoryToDelete}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          isLoading={deleteMut.isPending}
        />
      )}
    </>
  );
};
