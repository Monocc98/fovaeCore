import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../store/auth.store";
import { CustomFullscreenLoading } from "@/components/custom/CustomFullscreenLoading";

export const RedirectIfAuth = () => {
  const { authStatus } = useAuthStore();
  if (authStatus === "checking") return <CustomFullscreenLoading />;
  if (authStatus === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}
