import { useAuthStore } from "@/auth/store/auth.store";
import { getHomeAction } from "@/home/actions/get-home.action";
import { HeaderHome } from "@/home/components/HeaderHome";
import { useQuery } from "@tanstack/react-query";
import { Outlet } from "react-router";

export type OutletContext = {
  overlay: Awaited<ReturnType<typeof getHomeAction>>;
};

export const HomeLayoutV2 = () => {
  const { user, permissions } = useAuthStore(); // 👈 usuario actual
  console.log("AUTH STORE → permissions:", permissions);
  const userId = user?.id;

  const {
    data: overlay,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["homeOverlay", userId], // 👈 la key depende del usuario
    queryFn: () => getHomeAction(),
    enabled: !!userId, // solo cuando hay usuario
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHome />
      {isLoading && <div className="p-6">Cargando…</div>}
      {isError && (
        <div className="p-6 text-red-600 text-sm">Error al cargar.</div>
      )}
      {overlay && (
        <>
          <Outlet context={{ overlay } satisfies OutletContext} />
        </>
      )}
    </div>
  );
};
