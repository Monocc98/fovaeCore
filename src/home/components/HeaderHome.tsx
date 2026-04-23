import { useAuthStore } from "@/auth/store/auth.store";
import { CustomLogo } from "@/components/custom/CustomLogo";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";
import { Link } from "react-router";

export const HeaderHome = () => {
  const { user, permissions, logout } = useAuthStore();
  const isSuperAdmin = permissions?.globalRole === "SUPER_ADMIN";

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <CustomLogo />

        <div className="flex items-center space-x-3">
          {!user ? (
            <Link to="/auth">
              <Button variant="default" size="sm" className="ml-2">
                Login
              </Button>
            </Link>
          ) : (
            <>
              {isSuperAdmin && (
                <Link to="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Center
                  </Button>
                </Link>
              )}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                  {user?.name.substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                className="p-2 text-gray-600 hover:text-primary hover:bg-rose-50 rounded-lg transition-colors"
                onClick={() => void logout()}
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
