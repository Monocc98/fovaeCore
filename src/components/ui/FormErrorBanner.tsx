import { AlertCircle } from "lucide-react";
import { getErrorMessage, getRequestId } from "@/helpers";

type Props = {
  error: unknown;
  className?: string;
};

export const FormErrorBanner = ({ error, className = "" }: Props) => {
  if (!error) return null;

  const message = getErrorMessage(error);
  const requestId = getRequestId(error);

  return (
    <div className={`flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      <div>
        <p className="text-sm text-red-700">{message}</p>
        {requestId && <p className="mt-1 text-xs text-red-600">Request ID: {requestId}</p>}
      </div>
    </div>
  );
};
