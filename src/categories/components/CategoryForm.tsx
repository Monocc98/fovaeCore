import React from "react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

export interface CategoryFormValues {
  name: string;
  level: "category" | "subcategory" | "subsubcategory";
  parentId?: string;
  scope: "COMPANY" | "ACCOUNT";
  id?: string;
  type?: string;
  bucket?: string;
}

interface CategoryFormProps {
  onSubmit: (values: CategoryFormValues) => void;
  initialValues?: Partial<CategoryFormValues>;
  parentOptions?: { id: string; name: string }[];
  isLoading?: boolean;
  editMode?: boolean;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  onSubmit,
  initialValues,
  parentOptions = [],
  isLoading = false,
  editMode = false,
}) => {
  const { register, handleSubmit, watch, setValue, reset } = useForm<CategoryFormValues>({
    defaultValues: initialValues || {
      name: "",
      level: "category",
      scope: "COMPANY",
      parentId: "",
      type: "",
      bucket: "",
    },
  });

  const type = watch("type");
  const level = watch("level");

  // Auto-set bucket to INCOME when type is INCOME
  useEffect(() => {
    if (type === "INCOME") {
      setValue("bucket", "INCOME");
    }
  }, [type, setValue]);

  const getBucketOptions = () => {
    if (type === "INCOME") {
      return [{ value: "INCOME", label: "Ingreso" }];
    }
    if (type === "EXPENSE") {
      return [
        { value: "FIXED_EXPENSE", label: "Egreso Fijo" },
        { value: "VARIABLE_EXPENSE", label: "Egreso Variable" },
        { value: "FAMILY", label: "Family" },
      ];
    }
    return [];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-3 gap-4">
      <div className="col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre
        </label>
        <input
          {...register("name")}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nivel
        </label>
        <select
          {...register("level")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <option value="category">Categoría</option>
          <option value="subcategory">Subcategoría</option>
          <option value="subsubcategory">Sub-subcategoría</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scope
        </label>
        <select
          {...register("scope")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <option value="COMPANY">Empresa</option>
          <option value="ACCOUNT">Cuenta</option>
        </select>
      </div>

      {level !== "category" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Padre
          </label>
          <select
            {...register("parentId")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Seleccionar...</option>
            {parentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {level === "category" && (
        <>
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              {...register("type")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Seleccionar...</option>
              <option value="INCOME">Ingreso</option>
              <option value="EXPENSE">Egreso</option>
            </select>
          </div>

          {type && (
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bucket
              </label>
              <select
                {...register("bucket")}
                disabled={type === "INCOME"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <option value="">Seleccionar...</option>
                {getBucketOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {type === "INCOME" && (
                <p className="text-xs text-gray-500 mt-1">
                  Las categorías de ingresos se clasifican automáticamente
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div className="col-span-2 flex items-end gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {editMode ? "Actualizar" : "Agregar"}
        </button>
        <button
          type="button"
          onClick={() => reset()}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
};
