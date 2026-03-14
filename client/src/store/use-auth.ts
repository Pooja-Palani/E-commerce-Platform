import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@shared/schema';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  viewMode: 'BUYER' | 'SELLER';
  useAsUser: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setViewMode: (mode: 'BUYER' | 'SELLER') => void;
  setUseAsUser: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      viewMode: 'BUYER',
      useAsUser: false,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setViewMode: (viewMode) => set({ viewMode }),
      setUseAsUser: (useAsUser) => set({ useAsUser }),
    }),
    { name: 'qvanto-auth', partialize: (s) => ({ useAsUser: s.useAsUser }) }
  )
);
