import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => {
    sessionStorage.setItem('token', user.token);
    set({ user });
  },
  clearUser: () => {
    sessionStorage.removeItem('token');
    set({ user: null });
  },
}));
