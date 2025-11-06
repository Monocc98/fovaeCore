import { CustomFullscreenLoading } from "@/components/custom/CustomFullscreenLoading";
import { useAuthStore } from "../store/auth.store"
import { Navigate, Outlet } from "react-router";

export const RequiredAuth = () => {
    const { authStatus } = useAuthStore();
  if (authStatus === 'checking') return <CustomFullscreenLoading />;
  if (authStatus !== 'authenticated') return <Navigate to="/auth" replace />;
  return <Outlet />;
  
}
