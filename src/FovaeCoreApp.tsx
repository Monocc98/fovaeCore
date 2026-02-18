import { RouterProvider } from "react-router";
import { appRouter } from "./router/app.router";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { useEffect, type PropsWithChildren } from "react";
import { CustomFullscreenLoading } from "./components/custom/CustomFullscreenLoading";
import { useAuthStore } from "./auth/store/auth.store";
import { queryClient } from "@/lib/utils";

const CheckAuthProvider = ({ children }: PropsWithChildren) => {
  const { checkAuthStatus, authStatus, invalidateSession } = useAuthStore();

  useEffect(() => {
    const handleUnauthorized = () => {
      invalidateSession();
    };

    window.addEventListener("fovae:auth-unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("fovae:auth-unauthorized", handleUnauthorized);
    };
  }, [invalidateSession]);

  const { isLoading } = useQuery({
    queryKey: ["auth-check"], // ✅ como antes
    queryFn: checkAuthStatus,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: authStatus === "checking", // ✅ como antes
    staleTime: 0,
  });

  if (isLoading) return <CustomFullscreenLoading />;

  return children;
};

export const FovaeCoreApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <CheckAuthProvider>
        <RouterProvider router={appRouter} />
      </CheckAuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
