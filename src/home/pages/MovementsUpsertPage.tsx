import { useForm } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createMovementAction,
  getMovementByIdAction,
  updateMovementAction,
} from "../actions/movements.actions";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getCategoriesOverloadAction } from "../../categories/actions/categories.actions";
import { formatCurrency, formatDate, getErrorMessage, getFieldErrors, getTransactionColor } from "@/helpers";
import type { CategoriesResponse, Category } from "../../types";
import { FormErrorBanner } from "@/components/ui/FormErrorBanner";
import { QueryErrorState } from "@/components/ui/QueryErrorState";

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
  const { idMovement, idAccount, companyId } = useParams();
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

  const backTo = (
    (location.state as any)?.backTo ??
    (location.state as any)?.state?.backTo ??
    null
  ) as string | null;

  const navigateBack = () => {
    if (backTo) {
      navigate(backTo, { replace: true });
    } else {
      navigate(-1);
    }
  };

  const refreshHomeCaches = () => {
    void queryClient.invalidateQueries({
      queryKey: ["homeOverlay"],
      refetchType: "active",
    });
    void queryClient.invalidateQueries({
      queryKey: ["homeBucketsSummary"],
      refetchType: "active",
    });
  };

  const movementQuery = useQuery({
    queryKey: ["movement", idMovement],
    queryFn: () => getMovementByIdAction(idMovement!),
    enabled: isEditing,
  });

  const categoriesQuery = useQuery<CategoriesResponse>({
    queryKey: ["categories", companyId],
    queryFn: () => getCategoriesOverloadAction(companyId!),
    enabled: !!companyId,
  });

  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
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
  const [submitError, setSubmitError] = useState<unknown>(null);

  const applyServerFieldErrors = (error: unknown) => {
    const fieldErrors = getFieldErrors(error);
    const fieldMap: Record<string, keyof FormValues> = {
      occurredAt: "occurredAt",
      amount: "amount",
      description: "description",
      comments: "comments",
      account: "account",
      categoryId: "categoryId",
      subcategoryId: "subcategoryId",
      subsubcategory: "subsubcategory",
      subsubcategoryId: "subsubcategory",
    };

    Object.entries(fieldErrors).forEach(([key, message]) => {
      const formKey = fieldMap[key];
      if (!formKey) return;
      setError(formKey, { type: "server", message });
    });

    return Object.keys(fieldErrors).length > 0;
  };

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
    onSuccess: (createdMovement: any) => {
      setSubmitError(null);
      queryClient.setQueryData(["movementsOverlay", idAccount], (prev: any) => {
        if (!prev?.movements) return prev;
        return {
          ...prev,
          movements: [createdMovement, ...prev.movements],
        };
      });

      void queryClient.invalidateQueries({
        queryKey: ["movementsOverlay", idAccount],
        refetchType: "active",
      });
      refreshHomeCaches();
      navigateBack();
    },
    onError: (error) => {
      const hasFieldErrors = applyServerFieldErrors(error);
      setSubmitError(error);
      if (!hasFieldErrors) {
        toast.error(getErrorMessage(error, "No se pudo guardar el movimiento."));
      }
    },
  });

  const oldMovement = queryClient.getQueryData<any>(["movement", idMovement]);
  const oldAccountId = String(
    oldMovement?.movement?.account ?? oldMovement?.account ?? ""
  );

  const updateMut = useMutation({
    mutationFn: (payload: FormValues) =>
      updateMovementAction(idMovement!, {
        ...payload,
        categoryId: undefined,
        subcategoryId: undefined,
        subsubcategory: payload.subsubcategory,
      } as any),
    onSuccess: (data: any) => {
      setSubmitError(null);
      const updated = data?.movement ?? data;
      const newAccountId = String(updated?.account ?? "");

      if (oldAccountId === newAccountId) {
        queryClient.setQueryData(["movementsOverlay", oldAccountId], (prev: any) => {
          if (!prev?.movements) return prev;
          return {
            ...prev,
            movements: prev.movements.map((movement: any) =>
              String(movement.id ?? movement._id) === String(updated.id ?? updated._id)
                ? updated
                : movement
            ),
          };
        });
      } else {
        if (oldAccountId) {
          queryClient.setQueryData(["movementsOverlay", oldAccountId], (prev: any) => {
            if (!prev?.movements) return prev;
            return {
              ...prev,
              movements: prev.movements.filter(
                (movement: any) =>
                  String(movement.id ?? movement._id) !== String(updated.id ?? updated._id)
              ),
            };
          });
        }

        if (newAccountId) {
          queryClient.setQueryData(["movementsOverlay", newAccountId], (prev: any) => {
            if (!prev?.movements) return prev;
            return {
              ...prev,
              movements: [updated, ...prev.movements],
            };
          });
        }
      }

      if (oldAccountId) {
        void queryClient.invalidateQueries({
          queryKey: ["movementsOverlay", oldAccountId],
          refetchType: "active",
        });
      }
      if (newAccountId && newAccountId !== oldAccountId) {
        void queryClient.invalidateQueries({
          queryKey: ["movementsOverlay", newAccountId],
          refetchType: "active",
        });
      }
      queryClient.setQueryData(["movement", idMovement], data);
      refreshHomeCaches();
      navigateBack();
    },
    onError: (error) => {
      const hasFieldErrors = applyServerFieldErrors(error);
      setSubmitError(error);
      if (!hasFieldErrors) {
        toast.error(getErrorMessage(error, "No se pudo actualizar el movimiento."));
      }
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
    navigateBack();
    // const homeSnap = (location.state as any)?.homeSnapshot ?? null;
    // navigate("/", {
    //   replace: true,
    //   state: homeSnap ? { restoreHome: homeSnap } : null,
    // });
  };

  const onSubmit = (form: FormValues) => {
    if (createMut.isPending || updateMut.isPending) return;
    setSubmitError(null);
    clearErrors();
    if (!form.subsubcategory) {
      // valida que eligió la hoja
      return;
    }

    // Buscar la categoría seleccionada
    const parentCat = parentCategories.find((c) => c._id === form.categoryId);
    const isExpense = parentCat?.type === "EXPENSE"; // <- depende de tu modelo

    // Normalizar monto según tipo
    const rawAmount = Number(form.amount) || 0;
    const normalizedAmount = isExpense
      ? -Math.abs(rawAmount) // egreso -> siempre negativo
      : Math.abs(rawAmount); // ingreso -> siempre positivo

    const payload: FormValues = {
      ...form,
      amount: normalizedAmount,
    };

    if (mode === "edit") {
      updateMut.mutate(payload);
    } else {
      createMut.mutate(payload);
    }
  };

  const watchedAmount = watch("amount");
  const parentCat = parentCategories.find((c) => c._id === categoryId);
  const isExpense = parentCat?.type === "EXPENSE";

  const [amountInput, setAmountInput] = useState("");
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const isSubmitting = createMut.isPending || updateMut.isPending;

  const previewAmount = isExpense
    ? -Math.abs(Number(watchedAmount) || 0)
    : Math.abs(Number(watchedAmount) || 0);

  const normalizeAmountInput = (value: string) => {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const normalized = cleaned.replace(/(?!^)-/g, "");
    const parts = normalized.split(".");
    if (parts.length > 2) {
      return `${parts[0]}.${parts.slice(1).join("")}`;
    }
    return normalized;
  };

  const amountReg = register("amount", {
    required: true,
    onChange: (e) => {
      const next = normalizeAmountInput(e.target.value);
      setAmountInput(next);
      const numeric = Math.abs(Number(next) || 0);
      setValue("amount", numeric, { shouldDirty: true });
    },
    onBlur: () => {
      setIsAmountFocused(false);
      const numeric = Math.abs(Number(watchedAmount) || 0);
      setAmountInput(numeric ? formatCurrency(numeric) : "");
    },
  });

  useEffect(() => {
    if (isAmountFocused) return;
    const numeric = Math.abs(Number(watchedAmount) || 0);
    setAmountInput(numeric ? formatCurrency(numeric) : "");
  }, [watchedAmount, isAmountFocused]);

  if (movementQuery.isError) {
    return (
      <div className="max-w-4xl mx-auto py-4">
        <QueryErrorState
          error={movementQuery.error}
          onRetry={() => void movementQuery.refetch()}
          title="No se pudo cargar el movimiento"
        />
      </div>
    );
  }

  if (categoriesQuery.isError) {
    return (
      <div className="max-w-4xl mx-auto py-4">
        <QueryErrorState
          error={categoriesQuery.error}
          onRetry={() => void categoriesQuery.refetch()}
          title="No se pudieron cargar las categorias"
        />
      </div>
    );
  }

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
              disabled={isSubmitting}
              className="cursor-pointer px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className=" cursor-pointer px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </div>

        <FormErrorBanner error={submitError} className="mb-6" />

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
                      "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
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
                      "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
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
                    {...register("comments")}
                    placeholder="Describe el movimiento financiero..."
                    className={cn(
                      "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                      {
                        "border-red-500": errors.comments,
                      }
                    )}
                  />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    <div className="mt-2 p-2 bg-rose-50 rounded text-sm text-primary">
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

                {isEditing && movement?.externalConceptKey && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                    <span className="font-semibold">💡 Regla de importación:</span>
                    <span>
                      Este movimiento proviene de un archivo importado (Concepto: <strong>{movement.externalCategoryRaw || movement.externalConceptKey}</strong>). Al modificar la categoría, la regla se actualizará automáticamente para futuras importaciones.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Monto
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
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={amountInput}
                      onFocus={() => {
                        setIsAmountFocused(true);
                        const numeric = Math.abs(Number(watchedAmount) || 0);
                        setAmountInput(numeric ? String(numeric) : "");
                      }}
                      onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                      {...amountReg}
                      className={cn(
                        "w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
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
                {/* <div>
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

                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div> */}
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
                    {isExpense ? "Egreso" : "Ingreso"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monto:</span>
                  <span
                    className={`text-sm font-medium ${getTransactionColor(
                      previewAmount
                    )}`}
                  >
                    {previewAmount ? `$${previewAmount}` : "0"}
                  </span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <div>{getStatusBadge("completed")}</div>
                </div> */}
              </div>
            </div>

            {/* Quick Actions */}
            {/* <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center space-x-2 p-3 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Adjuntar Documento
                  </span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <Calculator className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium text-secondary">
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
                  {/* <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Estado: {"pending"}
                    </span>
                  </div> */}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
