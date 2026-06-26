import { create } from 'zustand';
import type { AuthUser } from '@/services/auth.types';

interface AuthStore {
  user: AuthUser | null;
  initializing: boolean;
  setUser: (user: AuthUser | null) => void;
  setInitializing: (initializing: boolean) => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  initializing: true,
  setUser: (user) => set({ user }),
  setInitializing: (initializing) => set({ initializing }),
}));
