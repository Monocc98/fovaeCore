import { getHomeAction } from "@/home/actions/get-home.action";
import { HeaderHome } from "@/home/components/HeaderHome";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet } from "react-router";

export type OutletContext = {
  overlay: Awaited<ReturnType<typeof getHomeAction>>;
};

export const HomeLayoutV2 = () => {
  const queryClient = useQueryClient();

  const {
    data: overlay,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["homeOverlay"],
    queryFn: () => getHomeAction(),
    initialData: () => queryClient.getQueryData(["homeOverlay"]),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHome username="Diego Castillo" />
      {isLoading && <div className="p-6">Cargando…</div>}
      {isError && (
        <div className="p-6 text-red-600 text-sm">Error al cargar.</div>
      )}
      {overlay && (
        // ¡Clave! Pasamos el overlay a todo el sub-árbol /v2 sin más peticiones
        <>
          <Outlet context={{ overlay } satisfies OutletContext} />
        </>
      )}
    </div>
  );
};
