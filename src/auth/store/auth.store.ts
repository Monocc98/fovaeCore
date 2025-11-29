// auth/store/auth.store.ts
import type { User, Permissions } from "@/types";
import { create } from "zustand";
import { loginAction } from "../actions/login.action";
import { checkAuthAction } from "../actions/check-auth.action";
import { queryClient } from "@/lib/utils";

type AuthStatus = "authenticated" | "no-authenticated" | "checking";

type AuthState = {
  user: User | null;
  token: string | null;
  permissions: Permissions | null;
  authStatus: AuthStatus;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  permissions: null,
  authStatus: "checking",

  // LOGIN
  login: async (email: string, password: string) => {
    try {
      const data = await loginAction(email, password);

      // 1) Guardar token nuevo
      localStorage.setItem("token", data.token);

      // 2) Limpiar toda la cache de React Query (para no ver datos del usuario anterior)
      await queryClient.cancelQueries();
      queryClient.clear();
      queryClient.removeQueries({ queryKey: ["homeOverlay"] });


      // 3) Actualizar estado
      set({
        user: data.user,
        token: data.token,
        permissions: data.permissions,
        authStatus: "authenticated",
      });


      return true;
    } catch {
      localStorage.removeItem("token");
      set({
        user: null,
        token: null,
        permissions: null,
        authStatus: "no-authenticated",
      });
      return false;
    }
  },

  // LOGOUT
  logout: () => {
    localStorage.removeItem("token");

    set({
      user: null,
      token: null,
      permissions: null, 
      authStatus: "no-authenticated",
    });

    queryClient.clear();

    // 🔥 Igual aquí: recargar para limpiar TODO estado en memoria // hay que mejorar el login
    window.location.reload();
  },

  // CHECK / RENEW al iniciar
  checkAuthStatus: async () => {
    const storedToken = localStorage.getItem("token");

    // Sin token => no autenticado
    if (!storedToken) {
      set({
        user: null,
        token: null,
        permissions: null,
        authStatus: "no-authenticated",
      });
      return false;
    }

    try {
      // usa el interceptor, así que mandará el token del localStorage
      const { user, token: newToken, permissions } = await checkAuthAction();

      localStorage.setItem("token", newToken);

      set({
        user,
        token: newToken,
        permissions: permissions,
        authStatus: "authenticated",
      });

      return true;
    } catch {
      localStorage.removeItem("token");
      set({
        user: null,
        token: null,
        permissions: null,
        authStatus: "no-authenticated",
      });
      return false;
    }
  },
}));
