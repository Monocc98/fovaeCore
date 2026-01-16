import { getStatusColor, getStatusIcon } from "@/helpers";

interface Props {
  process: PendingProcess;
  onClick?: (process: PendingProcess) => void;
}

export type PendingProcess = {
  id: string;
  status: "PENDING" | "FAILED" | "PROCESSING";
  source: "SERVO_ESCOLAR" | "SOLUCION_FACTIBLE";
  message: string;
  count: number;
};

export const ProcessBadge = ({ process, onClick }: Props) => {
  const statusColor = getStatusColor(process.status);
  const StatusIcon = getStatusIcon(process.status);

  return (
    <div
      onClick={() => onClick?.(process)}
      className={`border rounded-lg p-4 ${statusColor} transition-all hover:shadow-md cursor-pointer`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <StatusIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1">{process.message}</p>

          <div className="flex items-center justify-between">
            <span className="text-xs opacity-75">
              {process.count} {process.count === 1 ? "elemento" : "elementos"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
