import { Outlet, useLocation, useNavigate } from "react-router";
import { HeaderHome } from "../components/HeaderHome";
import { useHomeStore } from "../hooks/useHomeStore";
import { useEffect } from "react";

export const HomeLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { restoreHomeSnapshot } = useHomeStore();

  useEffect(() => {
    const restore = (location.state as any)?.restoreHome;
    if (!restore) return;

    // Restaura el store (mode + ids)
    restoreHomeSnapshot(restore);

    // Limpia el state de la entrada del history
    navigate(".", { replace: true, state: null });
  }, [location.state, navigate, restoreHomeSnapshot]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHome/>
      <Outlet />
    </div>
  );
};
