import { useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Bootstraps Firebase auth: configures Google Sign-In and subscribes to
 * auth-state changes, pushing the current user into the global auth store.
 * Mount this once near the root (see src/app/_layout.tsx), like
 * useNetworkMonitor.
 */
export function useAuthListener() {
  const setUser = useAuthStore((state) => state.setUser);
  const setInitializing = useAuthStore((state) => state.setInitializing);

  useEffect(() => {
    authService.configure();

    const unsubscribe = authService.subscribe((user) => {
      setUser(user);
      setInitializing(false);
    });

    return () => {
      unsubscribe();
    };
  }, [setUser, setInitializing]);
}
