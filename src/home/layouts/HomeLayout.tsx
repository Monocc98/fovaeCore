import { Outlet } from "react-router";
import { HeaderHome } from "../components/HeaderHome";

export const HomeLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHome username="Diego Castillo" />
      <div className="px-6 py-4">
        <Outlet />
      </div>
    </div>
  );
};
