import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../store/auth.store";

export const RedirectIfAuth = () => {
  const { authStatus } = useAuthStore();
  if (authStatus === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}
