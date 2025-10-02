export const getScopeBadge = (scope: string) => {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
  switch (scope) {
    case "COMPANY":
      return (
        <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
          Empresa
        </span>
      );
    case "ACCOUNT":
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800`}>
          Cuenta
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
