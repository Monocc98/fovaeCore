import type { User } from '@/home/types/user.interface';
import { create } from 'zustand'
import { loginAction } from '../actions/login.action';

type AuthStatus = 'authenticated' | 'no-authenticated' | 'checking';

type AuthState = {
  // Properties
    user: User | null;
    token: string | null;
    authStatus: AuthStatus;
  // Getters

  // Actions
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void
}

const initialToken = localStorage.getItem("token");

export const useAuthStore = create<AuthState>()((set) => ({
  // Implementación del Store
  user: null,
  token: initialToken,
    authStatus: initialToken ? 'authenticated' : 'no-authenticated',
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
  }
}));