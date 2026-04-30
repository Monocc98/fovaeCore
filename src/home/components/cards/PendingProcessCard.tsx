import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { QueryErrorState } from "@/components/ui/QueryErrorState";
import {
  ProcessBadge,
  type PendingProcess,
} from "./ui/pendingProcess/ProcessBadge";
import { getPendingImportBatchesByAccountAction } from "@/home/actions/movements.actions";

type Props = {
  accountId: string;
  onProcessClick?: (process: PendingProcess) => void;
  onViewAll?: () => void;
};

const PendingProcessesSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="rounded-lg border border-gray-200 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-4 w-36 rounded bg-gray-200" />
          <div className="h-5 w-20 rounded-full bg-gray-200" />
        </div>
        <div className="h-3 w-28 rounded bg-gray-100" />
      </div>
    ))}
  </div>
);

export const PendingProcessesCard = ({ accountId, onProcessClick }: Props) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["pendingImportBatches", accountId],
    queryFn: () => getPendingImportBatchesByAccountAction(accountId),
    enabled: !!accountId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
  });

  const processes = useMemo<PendingProcess[]>(() => {
    const batches = data?.batches ?? [];

    return batches.map((b) => ({
      id: b.id,
      status: b.status === "PENDING" ? "PENDING" : "PROCESSING",
      source:
        b.source === "SERVO_ESCOLAR" ? "SERVO_ESCOLAR" : "SOLUCION_FACTIBLE",
      message:
        b.source === "SERVO_ESCOLAR"
          ? "Importacion Servo Escolar pendiente"
          : "Importacion Solucion Factible pendiente",
      count: b.totalRows,
      date: b.createdAt,
    }));
  }, [data]);

  if (isLoading) return <PendingProcessesSkeleton />;

  if (isError) {
    return <QueryErrorState error={error} onRetry={() => void refetch()} title="No se pudieron cargar los procesos" />;
  }

  if (processes.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-sm text-gray-600">No hay procesos pendientes</p>
        <p className="text-xs text-gray-500 mt-1">
          Todos los movimientos estan completos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {processes.map((process) => (
        <ProcessBadge
          key={process.id}
          process={process}
          onClick={onProcessClick}
        />
      ))}
    </div>
  );
};
