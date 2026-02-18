import type { Permissions, User } from "@/types";
import { queryClient } from "@/lib/utils";
import { clearCsrfState } from "@/api/fovaeCore.api";
import { create } from "zustand";
import { checkAuthAction } from "../actions/check-auth.action";
import { loginAction } from "../actions/login.action";
import { logoutAction } from "../actions/logout.action";

type AuthStatus = "authenticated" | "no-authenticated" | "checking";

type AuthState = {
  user: User | null;
  permissions: Permissions | null;
  authStatus: AuthStatus;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  invalidateSession: () => void;
};

const clearAuthState = (set: (partial: Partial<AuthState>) => void) => {
  clearCsrfState();
  set({
    user: null,
    permissions: null,
    authStatus: "no-authenticated",
  });
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  permissions: null,
  authStatus: "checking",

  login: async (email: string, password: string) => {
    try {
      const data = await loginAction(email, password);

      await queryClient.cancelQueries();
      queryClient.clear();

      set({
        user: data.user,
        permissions: data.permissions,
        authStatus: "authenticated",
      });

      return true;
    } catch {
      clearAuthState(set);
      return false;
    }
  },

  logout: async () => {
    try {
      await logoutAction();
    } catch {
      // El backend puede fallar en logout; igual limpiamos estado local.
    } finally {
      clearAuthState(set);
      queryClient.clear();
    }
  },

  checkAuthStatus: async () => {
    try {
      const { user, permissions } = await checkAuthAction();

      set({
        user,
        permissions,
        authStatus: "authenticated",
      });

      return true;
    } catch {
      clearAuthState(set);
      return false;
    }
  },

  invalidateSession: () => {
    clearAuthState(set);
    queryClient.clear();
  },
}));
