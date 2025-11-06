import type { User } from '@/types';
import { create } from 'zustand'
import { loginAction } from '../actions/login.action';
import { checkAuthAction } from '../actions/check-auth.action';

type AuthStatus = 'authenticated' | 'no-authenticated' | 'checking';

type AuthState = {
  // Properties
    user: User | null;
    token: string | null;
    authStatus: AuthStatus;
  // Getters

  // Actions
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    checkAuthStatus: () => Promise<boolean>;
}


export const useAuthStore = create<AuthState>()((set:any) => ({
  // Implementación del Store
  user: null,
  token: null,
  authStatus: 'checking',
  // Actions
  login: async(email: string, password: string) => {

    try {
        const data = await loginAction(email, password);
        localStorage.setItem("token", data.token);
        set({ user: data.user, token: data.token, authStatus: 'authenticated' })
        return true;
    } catch (error) {
        localStorage.removeItem("token");
        set({ user: null, token: null, authStatus: 'no-authenticated'});
        return false;
    }

  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, authStatus: 'no-authenticated'});
  },

  checkAuthStatus: async() => {
    try {
      const { user, token } = await checkAuthAction();
      set({
        user: user,
        token: token,
        authStatus:  'authenticated',
      })
      return true;
    } catch (error) {
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        authStatus: 'no-authenticated'
      })
      return false;
    }
  }
}));