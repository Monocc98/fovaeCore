import { Navigate, Outlet, useOutletContext } from "react-router";
import { useAuthStore } from "../store/auth.store";

export const RequiredSuperAdmin = () => {
  const { authStatus, permissions } = useAuthStore();
  const parentContext = useOutletContext<unknown>();

  if (authStatus !== "authenticated") {
    return <Navigate to="/auth" replace />;
  }

  if (permissions?.globalRole !== "SUPER_ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet context={parentContext} />;
};
