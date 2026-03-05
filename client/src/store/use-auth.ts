import { create } from 'zustand';
import { User } from '@shared/schema';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  viewMode: 'BUYER' | 'SELLER';
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setViewMode: (mode: 'BUYER' | 'SELLER') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  viewMode: 'BUYER',
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setViewMode: (viewMode) => set({ viewMode }),
}));
