import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import {
  ProcessBadge,
  type PendingProcess,
} from "./ui/pendingProcess/ProcessBadge";
import { getPendingImportBatchesByAccountAction } from "@/home/actions/movements.actions";
// 👆 si lo dejaste en movements.actions.ts. Si lo separaste, ajusta import.

type Props = {
  accountId: string;
  onProcessClick?: (process: PendingProcess) => void;
  onViewAll?: () => void;
};

export const PendingProcessesCard = ({ accountId, onProcessClick }: Props) => {
  const { data, isLoading, isError } = useQuery({
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
      status: b.status === "PENDING" ? "PENDING" : "PROCESSING", // backend regresa PENDING, dejamos fallback
      source:
        b.source === "SERVO_ESCOLAR" ? "SERVO_ESCOLAR" : "SOLUCION_FACTIBLE",
      message:
        b.source === "SERVO_ESCOLAR"
          ? "Importación Servo Escolar pendiente"
          : "Importación Solución Factible pendiente",
      count: b.totalRows,
      date: b.createdAt,
    }));
  }, [data]);

  // UI states
  if (isLoading) {
    return <div className="text-sm text-gray-500">Cargando procesos…</div>;
  }

  if (isError) {
    return (
      <div className="text-sm text-red-600">
        No se pudieron cargar los procesos.
      </div>
    );
  }

  if (processes.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-sm text-gray-600">No hay procesos pendientes</p>
        <p className="text-xs text-gray-500 mt-1">
          Todos los movimientos están completos
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
