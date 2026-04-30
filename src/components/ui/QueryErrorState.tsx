import { AlertCircle, RefreshCw } from "lucide-react";
import { getErrorMessage, getRequestId, isRetryableError } from "@/helpers";

type Props = {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
};

export const QueryErrorState = ({
  error,
  onRetry,
  title = "No se pudo cargar la informacion",
  className = "",
}: Props) => {
  const message = getErrorMessage(error, "Intenta de nuevo.");
  const requestId = getRequestId(error);
  const canRetry = Boolean(onRetry) || isRetryableError(error);

  return (
    <div className={`rounded-xl border border-red-200 bg-red-50 p-6 text-center ${className}`}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <div className="text-base font-semibold text-gray-900">{title}</div>
      <p className="mt-2 text-sm text-red-700">{message}</p>
      {requestId && (
        <p className="mt-2 text-xs text-red-600">Request ID: {requestId}</p>
      )}
      {canRetry && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      )}
    </div>
  );
};
