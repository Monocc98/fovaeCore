import { useForm } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMovementAction,
  getMovementByIdAction,
  updateMovementAction,
} from "../actions/movements.actions";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useHomeStore } from "../hooks/useHomeStore";
import { getCategoriesOverloadAction } from "../actions/categories.actions";
import { formatDate, getStatusBadge, getTransactionColor } from "@/helpers";
import type { CategoriesResponse } from "../types/companiesResponse.interface";
import type { Category } from "../types/categories.interfaces";

type FormValues = {
  id?: string;
  description: string;
  comments: string;
  account: string | undefined;
  occurredAt: string; // yyyy-mm-dd
  amount: number;
  source: string;

  categoryId?: string;
  subcategoryId?: string;
  subsubcategory?: string; // ← este es el que persistes
};

export const MovementsUpsertPage = () => {
  const { idMovement, idAccount } = useParams();
  const { activeCompanyId } = useHomeStore();
  // const { parentCategories } = useCategories(); Pensar en como usar aquí

  const mode: "edit" | "create" | "invalid" = idMovement
    ? "edit"
    : idAccount
    ? "create"
    : "invalid";

  const isEditing = mode === "edit";
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const backTo = (location.state as any)?.backTo as string | null;

  const movementQuery = useQuery({
    queryKey: ["movement", idMovement],
    queryFn: () => getMovementByIdAction(idMovement!),
    enabled: isEditing,
  });

  const categoriesQuery = useQuery<CategoriesResponse>({
    queryKey: ["categories", activeCompanyId],
    queryFn: () => getCategoriesOverloadAction(activeCompanyId!),
    enabled: !!activeCompanyId,
  });

  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      description: "",
      comments: "",
      account: idAccount, // viene de la URL en create
      occurredAt: today,
      amount: 0,
      source: "MANUAL",
      categoryId: "",
      subcategoryId: "",
      subsubcategory: "",
    },
  });

  const parentCategories: Category[] =
    categoriesQuery.data?.company?.categories ?? [];
  const categoryId = watch("categoryId");
  const subcategoryId = watch("subcategoryId");

  // El padre actualmente seleccionado (o null)
  const selectedParent = useMemo(
    () => parentCategories.find((p) => p._id === categoryId) ?? null,
    [parentCategories, categoryId]
  );

  // Nivel 2: subcategorías del padre seleccionado (o [])
  const subcategories = useMemo(
    () => selectedParent?.subcategories ?? [],
    [selectedParent]
  );

  // La subcategoría actualmente seleccionada (o null)
  const selectedSub = useMemo(
    () => subcategories.find((s) => s._id === subcategoryId) ?? null,
    [subcategories, subcategoryId]
  );

  // Nivel 3: subsubcategorías de la subcategoría seleccionada (o [])
  const subsubcategories = useMemo(
    () => selectedSub?.subsubcategories ?? [],
    [selectedSub]
  );

  const asId = (x: any) => (x ? String(x.id ?? x._id ?? x) : "");

  const raw = movementQuery.data as any;
  const movement = raw?.movement ?? raw;
  const recordedAtDate = movement?.recordedAt
    ? new Date(movement.recordedAt)
    : null;

  useEffect(() => {
    if (mode !== "edit") return;
    const movement = raw?.movement ?? raw; // por si tu endpoint devuelve {movement}

    if (!movement) return;

    // Asegurar formato fecha para <input type="date">
    const occurredAt = movement.occurredAt
      ? new Date(movement.occurredAt).toISOString().slice(0, 10)
      : today;

    const leaf = movement.subsubcategory ?? movement.subsubcategoryId;

    const categoryId = asId(leaf?.parent?.parent); // string
    const subcategoryId = asId(leaf?.parent); // string
    const subsubcategory = asId(leaf); // string

    reset({
      id: movement.id ?? movement._id,
      description: movement.description ?? "",
      comments: movement.comments ?? "",
      account: movement.account?._id ?? movement.account ?? "",
      occurredAt,
      amount: movement.amount ?? 0,
      source: movement.source ?? "MANUAL",
      categoryId,
      subcategoryId,
      subsubcategory,
    });
  }, [mode, movementQuery.data, categoriesQuery.data, reset]);

  const createMut = useMutation({
    mutationFn: (payload: FormValues) =>
      createMovementAction({
        ...payload,
        // Persiste solo la hoja
        categoryId: undefined,
        subcategoryId: undefined,
        // Si tu API espera 'subsubcategoryId', asegúrate de enviarlo:
        subsubcategory: payload.subsubcategory,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements", idAccount] });

      const homeSnap = (location.state as any)?.homeSnapshot ?? null;
      // navigate(`/movement/${data.id}/edit`);
      navigate("/", {
        replace: true,
        state: homeSnap ? { restoreHome: homeSnap } : null,
      });
    },
  });

  const updateMut = useMutation({
    mutationFn: (payload: FormValues) =>
      updateMovementAction(idMovement!, {
        ...payload,
        categoryId: undefined,
        subcategoryId: undefined,
        subsubcategory: payload.subsubcategory,
      } as any),
    onSuccess: (data: any) => {
      queryClient.setQueryData(["movement", idMovement], data);
      // queryClient.invalidateQueries({ queryKey: ["movements", data.account] });
      const homeSnap = (location.state as any)?.homeSnapshot ?? null;
      navigate("/", {
        replace: true,
        state: homeSnap ? { restoreHome: homeSnap } : null,
      });
    },
  });

  const categoryReg = register("categoryId", {
    required: true,
    onChange: (e) => {
      const v = String(e.target.value);
      setValue("categoryId", v, { shouldDirty: true });
      setValue("subcategoryId", "", { shouldDirty: true });
      setValue("subsubcategory", "", { shouldDirty: true });
    },
  });

  const subcategoryReg = register("subcategoryId", {
    onChange: (e) => {
      const v = String(e.target.value);
      setValue("subcategoryId", v, { shouldDirty: true });
      setValue("subsubcategory", "", { shouldDirty: true });
    },
  });

  const handleCancel = () => {
    if (backTo) {
      navigate(backTo, { replace: true });
    } else {
      navigate(-1);
    }
    // const homeSnap = (location.state as any)?.homeSnapshot ?? null;
    // navigate("/", {
    //   replace: true,
    //   state: homeSnap ? { restoreHome: homeSnap } : null,
    // });
  };

  const onSubmit = (form: FormValues) => {
    if (!form.subsubcategory) {
      // valida que eligió la hoja
      return;
    }
    if (mode === "edit") updateMut.mutate(form);
    else createMut.mutate(form);
  };

  return (
    /* Movement Form */
    <div className="max-w-4xl mx-auto py-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
      >
        {/* Form Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Editar Movimiento" : "Nuevo Movimiento"}
            </h2>
            <p className="text-gray-600 mt-1">
              {isEditing
                ? "Modifica los detalles del movimiento financiero"
                : "Registra un nuevo movimiento financiero"}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="cursor-pointer px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              //   onClick={handleSaveMovement}
              className=" cursor-pointer px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              {isEditing ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="grid grid-cols-12 gap-8">
          {/* Main Form */}
          <div className="col-span-8 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información Básica
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    {...register("occurredAt", {
                      required: true,
                    })}
                    className={cn(
                      "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                      {
                        "border-red-500": errors.occurredAt,
                      }
                    )}
                  />
                  {errors.occurredAt && (
                    <p className="text-red-500 text-sm">
                      La fecha es requerida
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <input
                    type="text"
                    {...register("description", {
                      required: true,
                    })}
                    placeholder="Describe el movimiento financiero..."
                    className={cn(
                      "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                      {
                        "border-red-500": errors.description,
                      }
                    )}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm">
                      La descripción es requerida
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detalles de la Transacción
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentarios
                  </label>
                  <input
                    type="text"
                    {...register("comments", {
                      required: true,
                    })}
                    placeholder="Describe el movimiento financiero..."
                    className={cn(
                      "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                      {
                        "border-red-500": errors.comments,
                      }
                    )}
                  />
                  {errors.comments && (
                    <p className="text-red-500 text-sm">
                      El comentario es requerido
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorización
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Categoría
                    </label>
                    <select
                      {...categoryReg}
                      disabled={categoriesQuery.isLoading}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        { "border-red-500": errors.categoryId }
                      )}
                    >
                      <option value="">Seleccionar...</option>
                      {parentCategories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {errors["categoryId" as keyof FormValues] && (
                      <p className="text-red-500 text-sm">
                        La categoría es requerida
                      </p>
                    )}
                  </div>

                  {/* Subcategory */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Subcategoría
                    </label>
                    <select
                      {...subcategoryReg}
                      disabled={!categoryId || categoriesQuery.isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccionar...</option>
                      {subcategories.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subsubcategory */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Detalle
                    </label>
                    <select
                      {...register("subsubcategory")}
                      disabled={!subcategoryId || categoriesQuery.isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccionar...</option>
                      {subsubcategories.map((leaf) => (
                        <option key={leaf._id} value={leaf._id}>
                          {leaf.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category Path Preview */}
                {(categoryId ||
                  subcategoryId ||
                  watch("subsubcategory" as any)) && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                    <span className="font-medium">Ruta: </span>
                    {parentCategories.find((c) => c._id === categoryId)?.name}
                    {subcategoryId &&
                      " → " +
                        subcategories.find((s) => s._id === subcategoryId)
                          ?.name}
                    {watch("subsubcategory" as any) &&
                      " → " +
                        subsubcategories.find(
                          (l) => l._id === watch("subsubcategory" as any)
                        )?.name}
                  </div>
                )}
              </div>
            </div>

            {/* Amount and Status */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Monto y Estado
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      {...register("amount", {
                        required: true,
                      })}
                      className={cn(
                        "w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        {
                          "border-red-500": errors.comments,
                        }
                      )}
                    />
                    {errors.comments && (
                      <p className="text-red-500 text-sm">
                        El monto es requerido
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    // value={formData.status}
                    // onChange={(e) =>
                    //   handleInputChange(
                    //     "status",
                    //     e.target.value as "completed" | "pending" | "cancelled"
                    //   )
                    // }

                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Preview and Actions */}
          <div className="col-span-4 space-y-6">
            {/* Preview Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Vista Previa
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tipo:</span>
                  <span className="text-sm font-medium">
                    {watch("amount") > 0 ? "Ingreso" : "Egreso"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monto:</span>
                  <span
                    className={`text-sm font-medium ${getTransactionColor(
                      watch("amount")
                    )}`}
                  >
                    {watch("amount") ? `$${watch("amount")}` : "0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <div>{getStatusBadge("completed")}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {/* <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Adjuntar Documento
                  </span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <Calculator className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">
                    Calcular Impuestos
                  </span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                  <Calendar className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">
                    Programar Recordatorio
                  </span>
                </button>
              </div>
            </div> */}

            {/* Transaction History (if editing) */}
            {isEditing && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Historial
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Creado:{" "}
                      {recordedAtDate ? formatDate(recordedAtDate) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Estado: {"pending"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
