export const getStatusBadge = (status: string) => {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case "completed":
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800`}>
          Completado
        </span>
      );
    case "pending":
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
          Pendiente
        </span>
      );
    case "cancelled":
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800`}>
          Cancelado
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
