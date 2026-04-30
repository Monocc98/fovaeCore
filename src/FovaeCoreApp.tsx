import { RouterProvider } from "react-router";
import { appRouter } from "./router/app.router";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster, toast } from "sonner";
import { useEffect, type PropsWithChildren } from "react";
import { CustomFullscreenLoading } from "./components/custom/CustomFullscreenLoading";
import { useAuthStore } from "./auth/store/auth.store";
import { queryClient } from "@/lib/utils";
import { getErrorMessage, isAppError } from "@/helpers";

const isDisabledSessionPayload = (payload: unknown): boolean => {
  if (isAppError(payload)) {
    return payload.code === "USER_DISABLED";
  }

  if (typeof payload === "string") {
    return payload.toLowerCase().includes("disabled");
  }

  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidates = ["error", "message", "reason", "details"] as const;

  return candidates.some((key) => {
    const value = (payload as Record<string, unknown>)[key];
    return typeof value === "string" && value.toLowerCase().includes("disabled");
  });
};

const CheckAuthProvider = ({ children }: PropsWithChildren) => {
  const { checkAuthStatus, authStatus, invalidateSession } = useAuthStore();

  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail : null;

      if (isDisabledSessionPayload(detail)) {
        toast.error("Tu usuario fue desactivado.");
      } else if (isAppError(detail)) {
        toast.error(getErrorMessage(detail));
      }

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
