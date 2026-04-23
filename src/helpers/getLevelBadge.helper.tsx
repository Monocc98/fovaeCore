export const getLevelBadge = (level: string) => {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
  switch (level) {
    case "category":
      return (
        <span className={`${baseClasses} bg-rose-100 text-primary`}>
          Categoría
        </span>
      );
    case "subcategory":
      return (
        <span className={`${baseClasses} bg-orange-100 text-orange-800`}>
          Subcategoría
        </span>
      );
    case "subsubcategory":
      return (
        <span className={`${baseClasses} bg-slate-100 text-slate-800`}>
          Detalle
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
          Desconocido
        </span>
      );
  }
};
