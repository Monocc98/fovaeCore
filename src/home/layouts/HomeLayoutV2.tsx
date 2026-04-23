import { useAuthStore } from "@/auth/store/auth.store";
import { getHomeAction } from "@/home/actions/get-home.action";
import { HeaderHome } from "@/home/components/HeaderHome";
import { useQuery } from "@tanstack/react-query";
import { Outlet } from "react-router";

export type OutletContext = {
  overlay: Awaited<ReturnType<typeof getHomeAction>>;
};

const HomeDashboardSkeleton = () => (
  <div className="px-6 py-4 animate-pulse">
    <div className="mx-auto h-10 w-full max-w-2xl rounded-lg bg-gray-200" />
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-8 w-24 rounded-md bg-gray-200" />
        <div className="h-4 w-40 rounded bg-gray-200" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-9 w-52 rounded-md bg-gray-200" />
        <div className="h-6 w-24 rounded-full bg-gray-200" />
      </div>
    </div>

    <div className="mt-6 grid grid-cols-12 gap-6">
      <div className="col-span-12 space-y-6 lg:col-span-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="h-5 w-36 rounded bg-gray-200" />
              <div className="h-5 w-5 rounded bg-gray-200" />
            </div>
            <div className="space-y-3">
              <div className="h-14 rounded-lg bg-gray-200" />
              <div className="h-14 rounded-lg bg-gray-100" />
              <div className="h-14 rounded-lg bg-gray-100" />
            </div>
          </div>
        ))}
      </div>

      <div className="col-span-12 space-y-6 lg:col-span-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-5 h-6 w-56 rounded bg-gray-200" />
            <div className="h-52 rounded-lg bg-gray-100" />
          </div>
        ))}
      </div>

      <div className="col-span-12 space-y-6 lg:col-span-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5 h-6 w-40 rounded bg-gray-200" />
          <div className="space-y-4">
            <div className="h-16 rounded-lg bg-gray-200" />
            <div className="h-16 rounded-lg bg-gray-100" />
            <div className="h-16 rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const HomeLayoutV2 = () => {
  const { user } = useAuthStore();
  const userId = user?.id;

  const {
    data: overlay,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["homeOverlay", userId],
    queryFn: () => getHomeAction(),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHome />
      {isLoading && <HomeDashboardSkeleton />}
      {isError && (
        <div className="p-6 text-red-600 text-sm">Error al cargar.</div>
      )}
      {overlay && <Outlet context={{ overlay } satisfies OutletContext} />}
    </div>
  );
};
